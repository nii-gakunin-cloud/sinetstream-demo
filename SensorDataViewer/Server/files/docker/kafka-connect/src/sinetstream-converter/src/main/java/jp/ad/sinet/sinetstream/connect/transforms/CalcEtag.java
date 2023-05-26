package jp.ad.sinet.sinetstream.connect.transforms;

import static org.apache.kafka.connect.transforms.util.Requirements.requireMap;
import static org.apache.kafka.connect.transforms.util.Requirements.requireStructOrNull;

import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.common.cache.Cache;
import org.apache.kafka.common.cache.LRUCache;
import org.apache.kafka.common.cache.SynchronizedCache;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigException;
import org.apache.kafka.connect.connector.ConnectRecord;
import org.apache.kafka.connect.data.Field;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.errors.DataException;
import org.apache.kafka.connect.transforms.Transformation;
import org.apache.kafka.connect.transforms.util.SchemaUtil;
import org.apache.kafka.connect.transforms.util.SimpleConfig;

public abstract class CalcEtag<R extends ConnectRecord<R>> implements Transformation<R> {

    public static final String TARGET_FIELD_CONFIG = "field";
    private static final String TARGET_FIELD_DEFAULT = "";
    public static final String ETAG_FIELD_CONFIG = "etag";
    private static final String ETAG_FIELD_DEFAULT = "etag";
    public static final String RETAIN_CONFIG = "retain";
    private static final boolean RETAIN_DEFAULT = false;

    public static final ConfigDef CONFIG_DEF = new ConfigDef()
            .define(TARGET_FIELD_CONFIG, ConfigDef.Type.STRING, TARGET_FIELD_DEFAULT, ConfigDef.Importance.MEDIUM,
                    "Field to be calculated for ETag. Empty if the entire value is targeted.")
            .define(ETAG_FIELD_CONFIG, ConfigDef.Type.STRING, ETAG_FIELD_DEFAULT, ConfigDef.Importance.MEDIUM,
                    "Field to write ETag. Default value is etag.")
            .define(RETAIN_CONFIG, ConfigDef.Type.BOOLEAN, RETAIN_DEFAULT, ConfigDef.Importance.LOW,
                    "Whether to keep the field from which the etag was calculated.");

    private static final String PURPOSE = "calculate ETAG";

    private Cache<Schema, Schema> schemaUpdateCache;
    private String targetField;
    private String etagField;
    private boolean remainSourceField;

    private MessageDigest digest;
    private static final int CHUNK_SIZE = 16 * 1024 * 1024;
    private static final char[] HEX = "0123456789abcdef".toCharArray();

    private String calcEtag(ByteBuffer bytes) {
        ByteBuffer digestBuffer = ByteBuffer.allocate(-Math.floorDiv(-bytes.capacity(), CHUNK_SIZE) * 16);
        int count = 0;
        while (bytes.hasRemaining()) {
            int limit = bytes.position() + CHUNK_SIZE;
            if (limit > bytes.capacity()) {
                limit = bytes.capacity();
            }
            ByteBuffer chunk = bytes.limit(limit).slice();
            digest.reset();
            digest.update(chunk);
            digestBuffer.put(digest.digest());
            bytes.position(limit);
            bytes.limit(bytes.capacity());
            count += 1;
        }
        digestBuffer.flip();
        digest.reset();
        digest.update(digestBuffer);
        return toHexString(digest.digest(), count);
    }

    private static String toHexString(byte[] bytes, int count) {
        StringBuilder builder = new StringBuilder(bytes.length * 2 + 4);
        for (byte b : bytes) {
            builder.append(HEX[(b >> 4) & 0xf]);
            builder.append(HEX[b & 0xf]);
        }
        builder.append('-');
        builder.append(count);
        return builder.toString();
    }

    private Object toEtag(Object value) {
        if (value == null) {
            return null;
        }
        digest.reset();
        if (value instanceof ByteBuffer) {
            return calcEtag((ByteBuffer) value);
        } else if (value instanceof byte[]) {
            return calcEtag(ByteBuffer.wrap((byte[]) value));
        }
        throw new DataException(PURPOSE);
    }

    @Override
    public R apply(R record) {
        if (operatingSchema(record) == null) {
            return applySchemaless(record);
        } else {
            return applyWithSchema(record);
        }
    }

    private R applySchemaless(R record) {
        Object rawValue = operatingValue(record);
        if (rawValue == null || targetField.isEmpty()) {
            return newRecord(record, null, toEtag(rawValue));
        } else {
            final Map<String, Object> value = requireMap(rawValue, PURPOSE);
            final HashMap<String, Object> updatedValue = new HashMap<>(value);
            if (!remainSourceField) {
                updatedValue.remove(targetField);
            }
            updatedValue.put(etagField, toEtag(value.get(targetField)));
            return newRecord(record, null, updatedValue);
        }
    }

    private R applyWithSchema(R record) {
        final Schema schema = operatingSchema(record);
        Schema updatedSchema = getOrBuildSchema(schema);
        Object updatedValue;
        if (targetField.isEmpty()) {
            Object value = operatingValue(record);
            updatedValue = toEtag(value);
            return newRecord(record, updatedSchema, updatedValue);
        } else {
            final Struct value = requireStructOrNull(operatingValue(record), PURPOSE);
            updatedValue = applyValueWithSchema(value, updatedSchema);
        }
        return newRecord(record, updatedSchema, updatedValue);
    }

    private Struct applyValueWithSchema(Struct value, Schema updatedSchema) {
        if (value == null) {
            return null;
        }
        Struct updatedValue = new Struct(updatedSchema);
        for (Field field : value.schema().fields()) {
            boolean isTarget = field.name().equals(targetField);
            if (remainSourceField || !isTarget) {
                updatedValue.put(field.name(), value.get(field));
            }
            if (isTarget) {
                final Object updatedFieldValue = toEtag(value.get(field));
                updatedValue.put(etagField, updatedFieldValue);
            }
        }
        return updatedValue;
    }

    private Schema getOrBuildSchema(Schema schema) {
        Schema updatedSchema = schemaUpdateCache.get(schema);
        if (updatedSchema != null) {
            return updatedSchema;
        }
        if (schema.type().isPrimitive()) {
            final SchemaBuilder builder = SchemaUtil.copySchemaBasics(schema, SchemaBuilder.string());
            if (schema.isOptional()) {
                builder.optional();
            }
            updatedSchema = builder.build();
        } else {
            SchemaBuilder builder = SchemaUtil.copySchemaBasics(schema, SchemaBuilder.struct());
            for (Field field : schema.fields()) {
                if (field.name().equals(targetField)) {
                    if (remainSourceField) {
                        builder.field(field.name(), field.schema());
                    }
                    builder.field(etagField, getOrBuildSchema(field.schema()));
                } else {
                    builder.field(field.name(), field.schema());
                }
            }
            if (schema.isOptional()) {
                builder.optional();
            }
            if (schema.defaultValue() != null) {
                Struct updatedDefaultValue = applyValueWithSchema((Struct) schema.defaultValue(), builder);
                builder.defaultValue(updatedDefaultValue);
            }
            updatedSchema = builder.build();
        }
        schemaUpdateCache.put(schema, updatedSchema);
        return updatedSchema;
    }

    @Override
    public ConfigDef config() {
        return CONFIG_DEF;
    }

    @Override
    public void close() {
    }

    @Override
    public void configure(Map<String, ?> configs) {
        schemaUpdateCache = new SynchronizedCache<>(new LRUCache<>(16));
        final SimpleConfig config = new SimpleConfig(CONFIG_DEF, configs);
        targetField = config.getString(TARGET_FIELD_CONFIG);
        etagField = config.getString(ETAG_FIELD_CONFIG);
        if (etagField.isEmpty() && !targetField.isEmpty()) {
            throw new ConfigException(ETAG_FIELD_CONFIG);
        }
        remainSourceField = config.getBoolean(RETAIN_CONFIG);
        try {
            digest = MessageDigest.getInstance("MD5");
        } catch (NoSuchAlgorithmException e) {
            throw new ConnectException(e);
        }
    }

    protected abstract Schema operatingSchema(R record);

    protected abstract Object operatingValue(R record);

    protected abstract R newRecord(R record, Schema updatedSchema, Object updatedValue);

    public static final class Key<R extends ConnectRecord<R>> extends CalcEtag<R> {
        @Override
        protected Schema operatingSchema(R record) {
            return record.keySchema();
        }

        @Override
        protected Object operatingValue(R record) {
            return record.key();
        }

        @Override
        protected R newRecord(R record, Schema updatedSchema, Object updatedValue) {
            return record.newRecord(record.topic(), record.kafkaPartition(), updatedSchema, updatedValue,
                    record.valueSchema(), record.value(), record.timestamp());
        }
    }

    public static final class Value<R extends ConnectRecord<R>> extends CalcEtag<R> {
        @Override
        protected Schema operatingSchema(R record) {
            return record.valueSchema();
        }

        @Override
        protected Object operatingValue(R record) {
            return record.value();
        }

        @Override
        protected R newRecord(R record, Schema updatedSchema, Object updatedValue) {
            return record.newRecord(record.topic(), record.kafkaPartition(), record.keySchema(), record.key(),
                    updatedSchema, updatedValue, record.timestamp());
        }
    }
}
