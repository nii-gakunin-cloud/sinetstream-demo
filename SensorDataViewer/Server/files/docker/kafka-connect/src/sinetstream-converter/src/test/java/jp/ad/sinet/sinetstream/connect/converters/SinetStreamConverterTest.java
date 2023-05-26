package jp.ad.sinet.sinetstream.connect.converters;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.json.JsonConverterConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class SinetStreamConverterTest {

    private static final String TOPIC = "topic-0";
    private SinetStreamConverter converter;

    @BeforeEach
    void setUp() {
        converter = new SinetStreamConverter();
        converter.configure(Collections.singletonMap(JsonConverterConfig.SCHEMAS_ENABLE_CONFIG, false), false);
    }

    @Nested
    class MapValueByteBuffer {
        private Map<String, Object> value;

        @BeforeEach
        void setUp() {
            value = new HashMap<>();
            value.clear();
            value.put("tstamp", System.currentTimeMillis() * 1000);
            value.put("msg", ByteBuffer.wrap("text value".getBytes(StandardCharsets.UTF_8)));
        }

        @Test
        void fromMap() {
            byte[] bytes = converter.fromConnectData(TOPIC, null, value);
            assertNotNull(bytes);

            Object result = converter.toConnectData(TOPIC, bytes).value();
            assertInstanceOf(Struct.class, result);
            Struct conObj = (Struct) result;
            assertEquals(value.get("tstamp"), conObj.get("tstamp"));
            assertEquals(value.get("msg"), conObj.get("msg"));
        }
    }

    @Nested
    class MapValueByteArray {
        private Map<String, Object> value;

        @BeforeEach
        void setUp() {
            value = new HashMap<>();
            value.clear();
            value.put("tstamp", System.currentTimeMillis() * 1000);
            value.put("msg", "text value".getBytes(StandardCharsets.UTF_8));
        }

        @Test
        void fromMap() {
            byte[] bytes = converter.fromConnectData(TOPIC, null, value);
            assertNotNull(bytes);

            Object result = converter.toConnectData(TOPIC, bytes).value();
            assertInstanceOf(Struct.class, result);
            Struct conObj = (Struct) result;
            assertEquals(value.get("tstamp"), conObj.get("tstamp"));
            assertArrayEquals((byte[]) value.get("msg"),
                    ((ByteBuffer) conObj.get("msg")).array());
        }
    }

    @Nested
    class StructValueByteBuffer {
        private Struct value;

        @BeforeEach
        void setUp() {
            Schema schema = SchemaBuilder.struct()
                    .field("tstamp", Schema.INT64_SCHEMA)
                    .field("msg", Schema.BYTES_SCHEMA)
                    .build();

            value = new Struct(schema);
            value.put("tstamp", System.currentTimeMillis() * 1000);
            value.put("msg", ByteBuffer.wrap("text value".getBytes(StandardCharsets.UTF_8)));
        }

        @Test
        void fromStruct() {
            byte[] bytes = converter.fromConnectData(TOPIC, null, value);
            assertNotNull(bytes);

            Object result = converter.toConnectData(TOPIC, bytes).value();
            assertInstanceOf(Struct.class, result);
            Struct conObj = (Struct) result;
            assertEquals(value.get("tstamp"), conObj.get("tstamp"));
            assertEquals(value.get("msg"), conObj.get("msg"));
        }
    }

    @Nested
    class StructValueByteArray {
        private Struct value;

        @BeforeEach
        void setUp() {
            Schema schema = SchemaBuilder.struct()
                    .field("tstamp", Schema.INT64_SCHEMA)
                    .field("msg", Schema.BYTES_SCHEMA)
                    .build();

            value = new Struct(schema);
            value.put("tstamp", System.currentTimeMillis() * 1000);
            value.put("msg", "text value".getBytes(StandardCharsets.UTF_8));
        }

        @Test
        void fromStruct() {
            byte[] bytes = converter.fromConnectData(TOPIC, null, value);
            assertNotNull(bytes);

            Object result = converter.toConnectData(TOPIC, bytes).value();
            assertInstanceOf(Struct.class, result);
            Struct conObj = (Struct) result;
            assertEquals(value.get("tstamp"), conObj.get("tstamp"));
            assertArrayEquals((byte[]) value.get("msg"),
                    ((ByteBuffer) conObj.get("msg")).array());
        }
    }

}