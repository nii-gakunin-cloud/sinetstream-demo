package jp.ad.sinet.sinetstream.connect.transforms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.sink.SinkRecord;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class StringCastTest {

    private final StringCast<SinkRecord> xform = new StringCast.Value<>();

    private static final String TOPIC = "test";
    private static final String VALUE = "text-001";
    private static final double NUM_VALUE = 31.2;
    private static final byte[] VALUE_BYTES = VALUE.getBytes(StandardCharsets.UTF_8);

    @Nested
    class NoField {

        @BeforeEach
        void setUp() {
            xform.configure(Collections.emptyMap());
        }

        @AfterEach
        void tearDown() {
            xform.close();
        }

        @Test
        void nullValue() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    null, null, 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertNull(transformedRecord.valueSchema());
            assertNull(transformedRecord.value());
        }

        @Test
        void byteArrayValueWithSchema() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    Schema.BYTES_SCHEMA, VALUE_BYTES, 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertEquals(Schema.Type.STRING, transformedRecord.valueSchema().type());
            assertEquals(VALUE, transformedRecord.value());
        }

        @Test
        void byteBufferValueSchemaless() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    null, ByteBuffer.wrap(VALUE_BYTES), 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertNull(transformedRecord.valueSchema());
            assertEquals(VALUE, transformedRecord.value());
        }

        @Test
        void byteBufferValueWithSchema() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    Schema.BYTES_SCHEMA, ByteBuffer.wrap(VALUE_BYTES), 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertEquals(Schema.Type.STRING, transformedRecord.valueSchema().type());
            assertEquals(VALUE, transformedRecord.value());
        }

        @Test
        void stringValueSchemaless() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    null, VALUE, 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertNull(transformedRecord.valueSchema());
            assertEquals(VALUE, transformedRecord.value());
        }

        @Test
        void stringValueWithSchema() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    Schema.STRING_SCHEMA, VALUE, 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertEquals(Schema.Type.STRING, transformedRecord.valueSchema().type());
            assertEquals(VALUE, transformedRecord.value());
        }

        @Test
        void numericValueSchemaless() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    null, NUM_VALUE, 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertNull(transformedRecord.valueSchema());
            assertEquals(NUM_VALUE, Double.parseDouble((String) transformedRecord.value()));
        }

        @Test
        void numericValueWithSchema() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    Schema.FLOAT64_SCHEMA, NUM_VALUE, 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertEquals(Schema.Type.STRING, transformedRecord.valueSchema().type());
            assertEquals(NUM_VALUE, Double.parseDouble((String) transformedRecord.value()));
        }
    }

    @Nested
    class SpecifyField {

        private static final String FIELD_NAME = "msg";

        @BeforeEach
        void setUp() {
            Map<String, String> config = new HashMap<>();
            config.put(StringCast.FIELD_CONFIG, FIELD_NAME);
            xform.configure(config);

        }

        @AfterEach
        void tearDown() {
            xform.close();
        }

        @Test
        void nullValue() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    null, null, 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertNull(transformedRecord.valueSchema());
            assertNull(transformedRecord.value());
        }

        @Test
        void byteArrayValueWithSchema() {
            Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.BYTES_SCHEMA).build();
            Struct value = new Struct(schema);
            value.put(FIELD_NAME, VALUE_BYTES);
            SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
            final SinkRecord transformed = xform.apply(original);

            Schema expectedSchema = SchemaBuilder.struct().field(FIELD_NAME, Schema.STRING_SCHEMA).build();
            assertEquals(expectedSchema, transformed.valueSchema());
            assertEquals(VALUE, ((Struct) transformed.value()).get(FIELD_NAME));
        }

        @Test
        void byteBufferValueSchemaless() {
            Object value = Collections.singletonMap(FIELD_NAME, ByteBuffer.wrap(VALUE_BYTES));
            SinkRecord original = new SinkRecord(TOPIC, 0, null, null, null, value, 0);
            final SinkRecord transformed = xform.apply(original);
            assertNull(transformed.valueSchema());
            assertEquals(Collections.singletonMap(FIELD_NAME, VALUE), transformed.value());
        }

        @Test
        void byteBufferValueWithSchema() {
            Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.BYTES_SCHEMA).build();
            Struct value = new Struct(schema);
            value.put(FIELD_NAME, ByteBuffer.wrap(VALUE_BYTES));
            SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
            final SinkRecord transformed = xform.apply(original);

            Schema expectedSchema = SchemaBuilder.struct().field(FIELD_NAME, Schema.STRING_SCHEMA).build();
            assertEquals(expectedSchema, transformed.valueSchema());
            assertEquals(VALUE, ((Struct) transformed.value()).get(FIELD_NAME));
        }

        @Test
        void stringValueSchemaless() {
            Object value = Collections.singletonMap(FIELD_NAME, VALUE);
            SinkRecord original = new SinkRecord(TOPIC, 0, null, null, null, value, 0);
            final SinkRecord transformed = xform.apply(original);
            assertNull(transformed.valueSchema());
            assertEquals(Collections.singletonMap(FIELD_NAME, VALUE), transformed.value());
        }

        @Test
        void stringValueWithSchema() {
            Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.STRING_SCHEMA).build();
            Struct value = new Struct(schema);
            value.put(FIELD_NAME, VALUE);
            SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
            final SinkRecord transformed = xform.apply(original);

            assertEquals(schema, transformed.valueSchema());
            assertEquals(VALUE, ((Struct) transformed.value()).get(FIELD_NAME));
        }

        @Test
        void numericValueSchemaless() {
            Object value = Collections.singletonMap(FIELD_NAME, NUM_VALUE);
            SinkRecord original = new SinkRecord(TOPIC, 0, null, null, null, value, 0);
            final SinkRecord transformed = xform.apply(original);
            assertNull(transformed.valueSchema());
            assertEquals(Collections.singletonMap(FIELD_NAME, Double.toString(NUM_VALUE)), transformed.value());
        }

        @Test
        void numericValueWithSchema() {
            Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.FLOAT64_SCHEMA).build();
            Struct value = new Struct(schema);
            value.put(FIELD_NAME, NUM_VALUE);
            SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
            final SinkRecord transformed = xform.apply(original);

            Schema expectedSchema = SchemaBuilder.struct().field(FIELD_NAME, Schema.STRING_SCHEMA).build();
            assertEquals(expectedSchema, transformed.valueSchema());
            assertEquals(NUM_VALUE, Double.parseDouble((String) ((Struct) transformed.value()).get(FIELD_NAME)));
        }
    }
}