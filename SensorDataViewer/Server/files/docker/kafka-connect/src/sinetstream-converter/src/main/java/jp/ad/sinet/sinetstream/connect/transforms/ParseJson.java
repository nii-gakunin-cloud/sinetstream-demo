package jp.ad.sinet.sinetstream.connect.transforms;

import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.connect.connector.ConnectRecord;
import org.apache.kafka.connect.data.Field;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaAndValue;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.errors.DataException;
import org.apache.kafka.connect.json.JsonConverter;
import org.apache.kafka.connect.json.JsonConverterConfig;
import org.apache.kafka.connect.transforms.Transformation;
import org.apache.kafka.connect.transforms.util.SimpleConfig;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.apache.kafka.connect.transforms.util.Requirements.requireMap;
import static org.apache.kafka.connect.transforms.util.Requirements.requireStructOrNull;

public abstract class ParseJson<R extends ConnectRecord<R>> implements Transformation<R> {

    public static final String FIELD_CONFIG = "field";
    private static final String FIELD_DEFAULT = "";

    public static final ConfigDef CONFIG_DEF = new ConfigDef().define(FIELD_CONFIG, ConfigDef.Type.STRING, FIELD_DEFAULT, ConfigDef.Importance.MEDIUM, "Field name to parse as JSON.");
    private static final String PURPOSE = "json converter";
    protected JsonConverter converter = new JsonConverter();
    private String fieldName;

    @Override
    public void configure(Map<String, ?> props) {
        final SimpleConfig config = new SimpleConfig(CONFIG_DEF, props);
        fieldName = config.getString(FIELD_CONFIG);
    }

    @Override
    public R apply(R record) {
        Object rawValue = operatingValue(record);
        if (rawValue == null || fieldName.isEmpty()) {
            byte[] value = getJsonBytes(rawValue);
            SchemaAndValue result = converter.toConnectData(record.topic(), value);
            return newRecord(record, null, result.value());
        }

        final byte[] fieldValue;
        final HashMap<String, Object> updatedValue;
        if (operatingSchema(record) == null) {
            final Map<String, Object> value = requireMap(rawValue, PURPOSE);
            fieldValue = getJsonBytes(value.get(fieldName));
            updatedValue = new HashMap<>(value);
        } else {
            final Struct value = requireStructOrNull(rawValue, PURPOSE);
            fieldValue = getJsonBytes(value.get(fieldName));
            updatedValue = new HashMap<>();
            for (Field field : value.schema().fields()) {
                updatedValue.put(field.name(), value.get(field));
            }
        }
        SchemaAndValue res = converter.toConnectData(record.topic(), fieldValue);
        updatedValue.put(fieldName, res.value());
        return newRecord(record, null, updatedValue);
    }

    private byte[] getJsonBytes(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof byte[]) {
            return (byte[]) value;
        } else if (value instanceof ByteBuffer) {
            return ((ByteBuffer) value).array();
        } else if (value instanceof String) {
            return value.toString().getBytes(StandardCharsets.UTF_8);
        }
        throw new DataException("Expected JSON field type to be byte[] or String, but found " + value.getClass());
    }

    @Override
    public ConfigDef config() {
        return CONFIG_DEF;
    }

    @Override
    public void close() {
    }

    protected abstract Schema operatingSchema(R record);

    protected abstract Object operatingValue(R record);

    protected abstract R newRecord(R record, Schema updatedSchema, Object updatedValue);

    public static final class Key<R extends ConnectRecord<R>> extends ParseJson<R> {
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
            return record.newRecord(record.topic(), record.kafkaPartition(), updatedSchema, updatedValue, record.valueSchema(), record.value(), record.timestamp());
        }

        @Override
        public void configure(Map<String, ?> props) {
            super.configure(props);
            converter.configure(Collections.singletonMap(JsonConverterConfig.SCHEMAS_ENABLE_CONFIG, false), true);
        }
    }

    public static final class Value<R extends ConnectRecord<R>> extends ParseJson<R> {
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
            return record.newRecord(record.topic(), record.kafkaPartition(), record.keySchema(), record.key(), updatedSchema, updatedValue, record.timestamp());
        }

        @Override
        public void configure(Map<String, ?> props) {
            super.configure(props);
            converter.configure(Collections.singletonMap(JsonConverterConfig.SCHEMAS_ENABLE_CONFIG, false), false);
        }
    }
}
