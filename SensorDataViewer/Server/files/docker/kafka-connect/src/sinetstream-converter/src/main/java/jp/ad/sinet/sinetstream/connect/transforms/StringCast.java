package jp.ad.sinet.sinetstream.connect.transforms;

import static org.apache.kafka.connect.transforms.util.Requirements.requireMap;
import static org.apache.kafka.connect.transforms.util.Requirements.requireStructOrNull;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.common.cache.Cache;
import org.apache.kafka.common.cache.LRUCache;
import org.apache.kafka.common.cache.SynchronizedCache;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.utils.Utils;
import org.apache.kafka.connect.connector.ConnectRecord;
import org.apache.kafka.connect.data.Field;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.transforms.Transformation;
import org.apache.kafka.connect.transforms.util.SchemaUtil;
import org.apache.kafka.connect.transforms.util.SimpleConfig;

public abstract class StringCast<R extends ConnectRecord<R>> implements Transformation<R> {

    public static final String OVERVIEW_DOC = "Converts byte strings, numbers, etc. to strings."
            + "Applies to individual fields or to the entire value."
            + "<p/>Use the concrete transformation type designed for the record key (<code>"
            + StringCast.Key.class.getName() + "</code>) "
            + "or value (<code>" + StringCast.Value.class.getName() + "</code>).";

    public static final String FIELD_CONFIG = "field";
    private static final String FIELD_DEFAULT = "";

    public static final ConfigDef CONFIG_DEF = new ConfigDef()
            .define(FIELD_CONFIG, ConfigDef.Type.STRING, FIELD_DEFAULT, ConfigDef.Importance.MEDIUM,
                    "Field to be converted to string. Empty if the entire value is targeted.");

    private static final String PURPOSE = "converting to string";

    private Cache<Schema, Schema> schemaUpdateCache;
    private String fieldName;

    @Override
    public R apply(R record) {
        if (operatingSchema(record) == null) {
            return applySchemaless(record);
        } else {
            return applyWithSchema(record);
        }
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
        fieldName = config.getString(FIELD_CONFIG);
    }

    private R applyWithSchema(R record) {
        final Schema schema = operatingSchema(record);
        Schema updatedSchema = getOrBuildSchema(schema);
        Object updatedValue;
        if (fieldName.isEmpty()) {
            Object value = operatingValue(record);
            updatedValue = toString(value);
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
            final Object updatedFieldValue;
            if (field.name().equals(fieldName)) {
                updatedFieldValue = toString(value.get(field));
            } else {
                updatedFieldValue = value.get(field);
            }
            updatedValue.put(field.name(), updatedFieldValue);
        }
        return updatedValue;
    }

    private R applySchemaless(R record) {
        Object rawValue = operatingValue(record);
        if (rawValue == null || fieldName.isEmpty()) {
            return newRecord(record, null, toString(rawValue));
        } else {
            final Map<String, Object> value = requireMap(rawValue, PURPOSE);
            final HashMap<String, Object> updatedValue = new HashMap<>(value);
            updatedValue.put(fieldName, toString(value.get(fieldName)));
            return newRecord(record, null, updatedValue);
        }
    }

    private static String toString(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof byte[]) {
            byte[] rawBytes = (byte[]) value;
            return new String(rawBytes, StandardCharsets.UTF_8);
        } else if (value instanceof ByteBuffer) {
            ByteBuffer byteBuffer = (ByteBuffer) value;
            byte[] rawBytes = Utils.readBytes(byteBuffer);
            return new String(rawBytes, StandardCharsets.UTF_8);
        } else {
            return value.toString();
        }
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
                if (field.name().equals(fieldName)) {
                    builder.field(field.name(), getOrBuildSchema(field.schema()));
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

    protected abstract Schema operatingSchema(R record);

    protected abstract Object operatingValue(R record);

    protected abstract R newRecord(R record, Schema updatedSchema, Object updatedValue);

    public static final class Key<R extends ConnectRecord<R>> extends StringCast<R> {
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

    public static final class Value<R extends ConnectRecord<R>> extends StringCast<R> {
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
