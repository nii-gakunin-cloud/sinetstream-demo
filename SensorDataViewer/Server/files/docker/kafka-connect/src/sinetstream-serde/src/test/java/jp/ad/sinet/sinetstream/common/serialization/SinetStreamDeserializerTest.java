package jp.ad.sinet.sinetstream.common.serialization;

import org.apache.avro.AvroRuntimeException;
import org.apache.avro.Schema;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.message.BadHeaderException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.ZoneOffset;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class SinetStreamDeserializerTest {

    private Schema schema;

    private static final String TOPIC = "topic-0";
    private static final String MESSAGE = "message 0";
    private static final long TIMESTAMP = LocalDateTime.of(2020, Month.JANUARY, 1, 0, 0, 0)
            .toInstant(ZoneOffset.ofHours(9)).toEpochMilli();
    private static final byte[] V2_BYTE_DATA = {
            (byte) 0xc3, 0x01, 0x1f, (byte) 0x9c, 0x0c, (byte) 0x91, (byte) 0xeb, 0x33,
            0x66, 0x4f, (byte) 0x80, (byte) 0x96, (byte) 0xc4, (byte) 0xc7, (byte) 0xeb, 0x5b,
            0x12, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
            0x20, 0x30,
    };
    private static final byte[] V3_HEADER = {
            (byte) 0xdf, (byte) 0x3, (byte) 0x0, (byte) 0x0, (byte) 0, (byte) 0,
    };
    private static final byte[] V3_BYTE_DATA = new byte[V3_HEADER.length + V2_BYTE_DATA.length];
    static {
        System.arraycopy(V3_HEADER, 0, V3_BYTE_DATA, 0, V3_HEADER.length);
        System.arraycopy(V2_BYTE_DATA, 0, V3_BYTE_DATA, V3_HEADER.length, V2_BYTE_DATA.length);
    }

    @BeforeEach
    void setUp() throws IOException {
        schema = new Schema.Parser().parse(
                SinetStreamSerde.class.getResourceAsStream("/messageSchema.avsc"));
    }

    @Test
    void v2deserialize() {
        SinetStreamDeserializer deserializer = new SinetStreamDeserializer(schema);
        deserializer.configure(Collections.singletonMap(SinetStreamSerde.MESSAGE_FORMAT_CONFIG, 2), false);
        GenericRecord ret = deserializer.deserialize(TOPIC, V2_BYTE_DATA);
        assertEquals(TIMESTAMP, ret.get("tstamp"));
        assertEquals(MESSAGE, new String(((ByteBuffer) ret.get("msg")).array(), StandardCharsets.UTF_8));
    }

    @Test
    void v3deserialize() {
        SinetStreamDeserializer deserializer = new SinetStreamDeserializer(schema);
        deserializer.configure(Collections.emptyMap(), false);
        GenericRecord ret = deserializer.deserialize(TOPIC, V3_BYTE_DATA);
        assertEquals(TIMESTAMP, ret.get("tstamp"));
        assertEquals(MESSAGE, new String(((ByteBuffer) ret.get("msg")).array(), StandardCharsets.UTF_8));
    }

    @Test
    void nullData() {
        SinetStreamDeserializer deserializer = new SinetStreamDeserializer(schema);
        deserializer.configure(Collections.emptyMap(), false);
        GenericRecord ret = deserializer.deserialize(TOPIC, null);
        assertNull(ret);
    }

    @Nested
    class BadData {
        @Test
        void badHeader() {
            byte[] data = new byte[V2_BYTE_DATA.length];
            System.arraycopy(V2_BYTE_DATA, 0, data, 0, data.length);
            data[0] = 0;

            SinetStreamDeserializer deserializer = new SinetStreamDeserializer(schema);
            deserializer.configure(Collections.singletonMap(SinetStreamSerde.MESSAGE_FORMAT_CONFIG, 2), false);
            assertThrows(BadHeaderException.class, () -> deserializer.deserialize(TOPIC, data));
        }

        @Test
        void badHeaderV3() {
            byte[] data = new byte[V3_BYTE_DATA.length];
            System.arraycopy(V3_BYTE_DATA, 0, data, 0, data.length);
            data[1] = 2;

            SinetStreamDeserializer deserializer = new SinetStreamDeserializer(schema);
            deserializer.configure(Collections.emptyMap(), false);
            assertThrows(BadHeaderException.class, () -> deserializer.deserialize(TOPIC, data));
        }

        @Test
        void badLength() {
            byte[] data = new byte[V2_BYTE_DATA.length - 1];
            System.arraycopy(V2_BYTE_DATA, 0, data, 0, data.length);

            SinetStreamDeserializer deserializer = new SinetStreamDeserializer(schema);
            deserializer.configure(Collections.emptyMap(), false);
            assertThrows(AvroRuntimeException.class, () -> deserializer.deserialize(TOPIC, data));
        }

        @Test
        void tooShort() {
            byte[] data = { (byte) 0xdf, (byte) 0x3, (byte) 0x0, (byte) 0x0, };
            SinetStreamDeserializer deserializer = new SinetStreamDeserializer(schema);
            deserializer.configure(Collections.emptyMap(), false);
            assertThrows(SinetStreamSerdeException.class, () -> deserializer.deserialize(TOPIC, data));
        }

        @Test
        void tooShort2() {
            byte[] data = new byte[V3_HEADER.length];
            System.arraycopy(V3_HEADER, 0, data, 0, data.length);
            SinetStreamDeserializer deserializer = new SinetStreamDeserializer(schema);
            deserializer.configure(Collections.emptyMap(), false);
            assertThrows(BadHeaderException.class, () -> deserializer.deserialize(TOPIC, data));
        }
    }
}