package jp.ad.sinet.sinetstream.common.serialization;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericData;
import org.apache.kafka.common.config.ConfigException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.ZoneOffset;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class SinetStreamSerializerTest {

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
    void serializeV2() {
        GenericData.Record data = new GenericData.Record(schema);
        data.put("tstamp", TIMESTAMP);
        data.put("msg", ByteBuffer.wrap(MESSAGE.getBytes(StandardCharsets.UTF_8)));

        SinetStreamSerializer serializer = new SinetStreamSerializer(schema);
        serializer.configure(Collections.singletonMap(SinetStreamSerde.MESSAGE_FORMAT_CONFIG, 2), false);
        byte[] ret = serializer.serialize(TOPIC, data);
        assertArrayEquals(V2_BYTE_DATA, ret);
    }

    @Test
    void serializeV3() {
        GenericData.Record data = new GenericData.Record(schema);
        data.put("tstamp", TIMESTAMP);
        data.put("msg", ByteBuffer.wrap(MESSAGE.getBytes(StandardCharsets.UTF_8)));

        SinetStreamSerializer serializer = new SinetStreamSerializer(schema);
        serializer.configure(Collections.emptyMap(), false);
        byte[] ret = serializer.serialize(TOPIC, data);
        assertArrayEquals(V3_BYTE_DATA, ret);
    }

    @Test
    void nullData() {
        SinetStreamSerializer serializer = new SinetStreamSerializer(schema);
        serializer.configure(Collections.emptyMap(), false);
        byte[] ret = serializer.serialize(TOPIC, null);
        assertNull(ret);
    }

    @Test
    void badData() {
        GenericData.Record data = new GenericData.Record(schema);
        data.put("tstamp", TIMESTAMP);
        data.put("msg", MESSAGE);

        SinetStreamSerializer serializer = new SinetStreamSerializer(schema);
        serializer.configure(Collections.emptyMap(), false);
        assertThrows(ClassCastException.class, () -> serializer.serialize(TOPIC, data));
    }

    @Test
    void badConfig() {
        SinetStreamSerializer serializer = new SinetStreamSerializer(schema);
        serializer.configure(Collections.emptyMap(), false);
        assertThrows(ConfigException.class,
                () -> serializer.configure(Collections.singletonMap(SinetStreamSerde.MESSAGE_FORMAT_CONFIG, 1), false));
    }
}