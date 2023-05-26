package jp.ad.sinet.sinetstream.connect.transforms;

import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.connect.connector.ConnectRecord;
import org.apache.kafka.connect.data.Field;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.errors.DataException;
import org.apache.kafka.connect.transforms.TimestampConverter;
import org.apache.kafka.connect.transforms.Transformation;
import org.apache.kafka.connect.transforms.util.SimpleConfig;

import java.util.HashMap;
import java.util.Map;

import static org.apache.kafka.connect.transforms.TimestampConverter.FIELD_CONFIG;
import static org.apache.kafka.connect.transforms.util.Requirements.requireMap;
import static org.apache.kafka.connect.transforms.util.Requirements.requireStructOrNull;

public abstract class MicrosecondTimestampConverter<R extends ConnectRecord<R>> implements Transformation<R> {

    protected TimestampConverter<R> converter;
    private String targetField;
    private static final String PURPOSE = "converting timestamp formats";

    @Override
    public R apply(R record) {
        return converter.apply(operatingSchema(record) == null ? applySchemaless(record) : applyWithSchema(record));
    }

    private Long toUnixTimestamp(Object value) {
        if (!(value instanceof Long)) {
            throw new DataException("Expected Unix timestamp to be a Long, but found " + value.getClass());
        }
        return ((Long) value) / 1000L;
    }

    private R applyWithSchema(R record) {
        final Schema schema = operatingSchema(record);
        if (targetField.isEmpty()) {
            Object value = operatingValue(record);
            return newRecord(record, schema, value != null ? toUnixTimestamp(value) : null);
        } else {
            final Struct value = requireStructOrNull(operatingValue(record), PURPOSE);
            if (value == null) {
                return record;
            }
            Struct newValue = new Struct(schema);
            for (Field field : value.schema().fields()) {
                Object fieldValue = value.get(field);
                newValue.put(field.name(), field.name().equals(targetField) ? toUnixTimestamp(fieldValue) : fieldValue);
            }
            return newRecord(record, schema, newValue);
        }
    }

    private R applySchemaless(R record) {
        Object rawValue = operatingValue(record);
        if (rawValue == null) {
            return record;
        } else if (targetField.isEmpty()) {
            return newRecord(record, null, toUnixTimestamp(rawValue));
        } else {
            final Map<String, Object> value = requireMap(rawValue, PURPOSE);
            final HashMap<String, Object> updatedValue = new HashMap<>(value);
            updatedValue.put(targetField, toUnixTimestamp(value.get(targetField)));
            return newRecord(record, null, updatedValue);
        }
    }

    @Override
    public ConfigDef config() {
        return converter.config();
    }

    @Override
    public void close() {
        converter.close();
    }

    @Override
    public void configure(Map<String, ?> configs) {
        converter.configure(configs);
        final SimpleConfig simpleConfig = new SimpleConfig(converter.config(), configs);
        targetField = simpleConfig.getString(FIELD_CONFIG);
    }

    protected abstract Schema operatingSchema(R record);

    protected abstract Object operatingValue(R record);

    protected abstract R newRecord(R record, Schema updatedSchema, Object updatedValue);

    public static final class Key<R extends ConnectRecord<R>> extends MicrosecondTimestampConverter<R> {
        public Key() {
            converter = new TimestampConverter.Key<>();
        }

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
    }

    public static final class Value<R extends ConnectRecord<R>> extends MicrosecondTimestampConverter<R> {
        public Value() {
            converter = new TimestampConverter.Value<>();
        }

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
    }
}
