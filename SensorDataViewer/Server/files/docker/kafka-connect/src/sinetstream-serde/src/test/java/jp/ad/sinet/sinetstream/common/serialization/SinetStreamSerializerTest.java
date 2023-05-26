package jp.ad.sinet.sinetstream.common.serialization;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class SinetStreamSerializerTest {

    private Schema schema;

    private static final String TOPIC = "topic-0";
    private static final String MESSAGE = "message 0";
    private static final long TIMESTAMP =
            LocalDateTime.of(2020, Month.JANUARY, 1, 0, 0, 0)
            .toInstant(ZoneOffset.ofHours(9)).toEpochMilli();
    private static final byte[] EXPECTED = {
            (byte) 0xc3, 0x01, 0x1f, (byte) 0x9c, 0x0c, (byte) 0x91, (byte) 0xeb, 0x33,
            0x66, 0x4f, (byte) 0x80, (byte) 0x96, (byte) 0xc4, (byte) 0xc7, (byte) 0xeb, 0x5b,
            0x12, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
            0x20, 0x30,
    };

    @BeforeEach
    void setUp() throws IOException {
        schema = new Schema.Parser().parse(
                SinetStreamSerde.class.getResourceAsStream("/messageSchema.avsc"));
    }

    @Test
    void serialize() {
        GenericData.Record data = new GenericData.Record(schema);
        data.put("tstamp", TIMESTAMP);
        data.put("msg", ByteBuffer.wrap(MESSAGE.getBytes(StandardCharsets.UTF_8)));

        SinetStreamSerializer serializer = new SinetStreamSerializer(schema);
        byte[] ret = serializer.serialize(TOPIC, data);
        assertArrayEquals(EXPECTED, ret);
    }

    @Test
    void nullData() {
        SinetStreamSerializer serializer = new SinetStreamSerializer(schema);
        byte[] ret = serializer.serialize(TOPIC, null);
        assertNull(ret);
    }

    @Test
    void badData() {
        GenericData.Record data = new GenericData.Record(schema);
        data.put("tstamp", TIMESTAMP);
        data.put("msg", MESSAGE);

        SinetStreamSerializer serializer = new SinetStreamSerializer(schema);
        assertThrows(ClassCastException.class, () -> serializer.serialize(TOPIC, data));
    }
}