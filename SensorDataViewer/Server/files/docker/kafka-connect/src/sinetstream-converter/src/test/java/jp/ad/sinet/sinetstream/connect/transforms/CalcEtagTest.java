package jp.ad.sinet.sinetstream.connect.transforms;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.errors.DataException;
import org.apache.kafka.connect.sink.SinkRecord;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class CalcEtagTest {

    private final CalcEtag<SinkRecord> xform = new CalcEtag.Value<>();

    private static final String TOPIC = "test";
    private static final String VALUE = "text-001";
    private static final byte[] VALUE_BYTES = VALUE.getBytes(StandardCharsets.UTF_8);
    private static final String ETAG_VALUE_BYTE = "e24b8f793cd5d92d632e27dfecb56d1b-1";

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
        void byteArrayValueSchemaless() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    null, VALUE_BYTES, 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertNull(transformedRecord.valueSchema());
            assertEquals(ETAG_VALUE_BYTE, transformedRecord.value());
        }

        @Test
        void byteArrayValueWithSchema() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    Schema.BYTES_SCHEMA, VALUE_BYTES, 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertEquals(Schema.Type.STRING, transformedRecord.valueSchema().type());
            assertEquals(ETAG_VALUE_BYTE, transformedRecord.value());
        }

        @Test
        void byteBufferValueSchemaless() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    null, ByteBuffer.wrap(VALUE_BYTES), 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertNull(transformedRecord.valueSchema());
            assertEquals(ETAG_VALUE_BYTE, transformedRecord.value());
        }

        @Test
        void byteBufferValueWithSchema() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    Schema.BYTES_SCHEMA, ByteBuffer.wrap(VALUE_BYTES), 0);
            final SinkRecord transformedRecord = xform.apply(record);
            assertEquals(Schema.Type.STRING, transformedRecord.valueSchema().type());
            assertEquals(ETAG_VALUE_BYTE, transformedRecord.value());
        }

        @Test
        void stringValueSchemaless() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    null, VALUE, 0);
            Assertions.assertThrows(DataException.class, () -> xform.apply(record));
        }

        @Test
        void stringValueWithSchema() {
            final SinkRecord record = new SinkRecord(
                    TOPIC, 0, null, null,
                    Schema.STRING_SCHEMA, VALUE, 0);
            Assertions.assertThrows(DataException.class, () -> xform.apply(record));
        }

        @Nested
        class LargeBytes {
            private ByteBuffer zero33mb = ByteBuffer.allocate(33 * 1024 * 1024);
            private static final String ETAG_LARGE_BYTES = "1233e638842d834c4a8b518d7901b782-3"; // 33mb zero bytes

            @BeforeEach
            void setUp() {
                Arrays.fill(zero33mb.array(), (byte) 0);
                zero33mb.position(0);
            }

            @Test
            void byteBufferValueSchemaless() {
                final SinkRecord record = new SinkRecord(
                        TOPIC, 0, null, null,
                        null, zero33mb, 0);
                final SinkRecord transformedRecord = xform.apply(record);
                assertNull(transformedRecord.valueSchema());
                assertEquals(ETAG_LARGE_BYTES, transformedRecord.value());
            }

            @Test
            void byteBufferValueWithSchema() {
                final SinkRecord record = new SinkRecord(
                        TOPIC, 0, null, null,
                        Schema.BYTES_SCHEMA, zero33mb, 0);
                final SinkRecord transformedRecord = xform.apply(record);
                assertEquals(Schema.Type.STRING, transformedRecord.valueSchema().type());
                assertEquals(ETAG_LARGE_BYTES, transformedRecord.value());
            }
        }
    }

    @Nested
    class SpecifyField {
        private static final String FIELD_NAME = "msg";

        @AfterEach
        void tearDown() {
            xform.close();
        }

        @Nested
        class DefaultConfig {
            @BeforeEach
            void setUp() {
                Map<String, String> config = new HashMap<>();
                config.put(CalcEtag.TARGET_FIELD_CONFIG, FIELD_NAME);
                xform.configure(config);
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
            void byteBufferValueSchemaless() {
                Object value = Collections.singletonMap(FIELD_NAME, ByteBuffer.wrap(VALUE_BYTES));
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, null, value, 0);
                final SinkRecord transformed = xform.apply(original);
                assertNull(transformed.valueSchema());
                assertEquals(Collections.singletonMap("etag", ETAG_VALUE_BYTE), transformed.value());
            }

            @Test
            void byteArrayValueSchemaless() {
                Object value = Collections.singletonMap(FIELD_NAME, VALUE_BYTES);
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, null, value, 0);
                final SinkRecord transformed = xform.apply(original);
                assertNull(transformed.valueSchema());
                assertEquals(Collections.singletonMap("etag", ETAG_VALUE_BYTE), transformed.value());
            }

            @Test
            void byteBufferValueWithSchema() {
                Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.BYTES_SCHEMA).build();
                Struct value = new Struct(schema);
                value.put(FIELD_NAME, ByteBuffer.wrap(VALUE_BYTES));
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
                final SinkRecord transformed = xform.apply(original);

                Schema expectedSchema = SchemaBuilder.struct().field("etag", Schema.STRING_SCHEMA).build();
                assertEquals(expectedSchema, transformed.valueSchema());
                assertEquals(ETAG_VALUE_BYTE, ((Struct) transformed.value()).get("etag"));
            }

            @Test
            void byteArrayValueWithSchema() {
                Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.BYTES_SCHEMA).build();
                Struct value = new Struct(schema);
                value.put(FIELD_NAME, VALUE_BYTES);
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
                final SinkRecord transformed = xform.apply(original);

                Schema expectedSchema = SchemaBuilder.struct().field("etag", Schema.STRING_SCHEMA).build();
                assertEquals(expectedSchema, transformed.valueSchema());
                assertEquals(ETAG_VALUE_BYTE, ((Struct) transformed.value()).get("etag"));
            }
        }

        @Nested
        class EtagFieldName {
            private static final String ETAG_FIELD = "etag00";

            @BeforeEach
            void setUp() {
                Map<String, Object> config = new HashMap<>();
                config.put(CalcEtag.TARGET_FIELD_CONFIG, FIELD_NAME);
                config.put(CalcEtag.ETAG_FIELD_CONFIG, ETAG_FIELD);
                xform.configure(config);
            }

            @Test
            void byteBufferValueSchemaless() {
                Object value = Collections.singletonMap(FIELD_NAME, ByteBuffer.wrap(VALUE_BYTES));
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, null, value, 0);
                final SinkRecord transformed = xform.apply(original);
                assertNull(transformed.valueSchema());
                assertEquals(Collections.singletonMap(ETAG_FIELD, ETAG_VALUE_BYTE), transformed.value());
            }

            @Test
            void byteArrayValueSchemaless() {
                Object value = Collections.singletonMap(FIELD_NAME, VALUE_BYTES);
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, null, value, 0);
                final SinkRecord transformed = xform.apply(original);
                assertNull(transformed.valueSchema());
                assertEquals(Collections.singletonMap(ETAG_FIELD, ETAG_VALUE_BYTE), transformed.value());
            }

            @Test
            void byteBufferValueWithSchema() {
                Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.BYTES_SCHEMA).build();
                Struct value = new Struct(schema);
                value.put(FIELD_NAME, ByteBuffer.wrap(VALUE_BYTES));
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
                final SinkRecord transformed = xform.apply(original);

                Schema expectedSchema = SchemaBuilder.struct().field(ETAG_FIELD, Schema.STRING_SCHEMA).build();
                assertEquals(expectedSchema, transformed.valueSchema());
                assertEquals(ETAG_VALUE_BYTE, ((Struct) transformed.value()).get(ETAG_FIELD));
            }

            @Test
            void byteArrayValueWithSchema() {
                Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.BYTES_SCHEMA).build();
                Struct value = new Struct(schema);
                value.put(FIELD_NAME, VALUE_BYTES);
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
                final SinkRecord transformed = xform.apply(original);

                Schema expectedSchema = SchemaBuilder.struct().field(ETAG_FIELD, Schema.STRING_SCHEMA).build();
                assertEquals(expectedSchema, transformed.valueSchema());
                assertEquals(ETAG_VALUE_BYTE, ((Struct) transformed.value()).get(ETAG_FIELD));
            }
        }

        @Nested
        class RemainSourceFIeld {
            @BeforeEach
            void setUp() {
                Map<String, Object> config = new HashMap<>();
                config.put(CalcEtag.TARGET_FIELD_CONFIG, FIELD_NAME);
                config.put(CalcEtag.RETAIN_CONFIG, true);
                xform.configure(config);
            }

            @Test
            void byteBufferValueSchemaless() {
                Object value = Collections.singletonMap(FIELD_NAME, ByteBuffer.wrap(VALUE_BYTES));
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, null, value, 0);
                final SinkRecord transformed = xform.apply(original);
                assertNull(transformed.valueSchema());
                assertEquals(ETAG_VALUE_BYTE, ((Map<?, ?>) transformed.value()).get("etag"));
                assertArrayEquals(VALUE_BYTES,
                        ((ByteBuffer) ((Map<?, ?>) transformed.value()).get(FIELD_NAME)).array());
            }

            @Test
            void byteArrayValueSchemaless() {
                Object value = Collections.singletonMap(FIELD_NAME, VALUE_BYTES);
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, null, value, 0);
                final SinkRecord transformed = xform.apply(original);
                assertNull(transformed.valueSchema());
                assertEquals(ETAG_VALUE_BYTE, ((Map<?, ?>) transformed.value()).get("etag"));
                assertArrayEquals(VALUE_BYTES, (byte[]) ((Map<?, ?>) transformed.value()).get(FIELD_NAME));
            }

            @Test
            void byteBufferValueWithSchema() {
                Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.BYTES_SCHEMA).build();
                Struct value = new Struct(schema);
                value.put(FIELD_NAME, ByteBuffer.wrap(VALUE_BYTES));
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
                final SinkRecord transformed = xform.apply(original);

                Schema expectedSchema = SchemaBuilder.struct()
                        .field(FIELD_NAME, Schema.BYTES_SCHEMA)
                        .field("etag", Schema.STRING_SCHEMA)
                        .build();
                assertEquals(expectedSchema, transformed.valueSchema());
                Struct resultValue = (Struct) transformed.value();
                assertEquals(ETAG_VALUE_BYTE, resultValue.get("etag"));
                assertArrayEquals(VALUE_BYTES, ((ByteBuffer) resultValue.get(FIELD_NAME)).array());
            }

            @Test
            void byteArrayValueWithSchema() {
                Schema schema = SchemaBuilder.struct().field(FIELD_NAME, Schema.BYTES_SCHEMA).build();
                Struct value = new Struct(schema);
                value.put(FIELD_NAME, VALUE_BYTES);
                SinkRecord original = new SinkRecord(TOPIC, 0, null, null, schema, value, 0);
                final SinkRecord transformed = xform.apply(original);

                Schema expectedSchema = SchemaBuilder.struct()
                        .field(FIELD_NAME, Schema.BYTES_SCHEMA)
                        .field("etag", Schema.STRING_SCHEMA)
                        .build();
                assertEquals(expectedSchema, transformed.valueSchema());
                Struct resultValue = (Struct) transformed.value();
                assertEquals(ETAG_VALUE_BYTE, resultValue.get("etag"));
                assertArrayEquals(VALUE_BYTES, (byte[]) resultValue.get(FIELD_NAME));
            }
        }
    }
}