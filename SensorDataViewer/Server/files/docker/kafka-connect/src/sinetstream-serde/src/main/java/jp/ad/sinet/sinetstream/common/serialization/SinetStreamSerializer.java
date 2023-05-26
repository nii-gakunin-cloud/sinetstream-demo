package jp.ad.sinet.sinetstream.common.serialization;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.message.BinaryMessageEncoder;
import org.apache.kafka.common.serialization.Serializer;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Objects;

public class SinetStreamSerializer implements Serializer<GenericRecord> {

    private final BinaryMessageEncoder<GenericRecord> encoder;

    SinetStreamSerializer(Schema schema) {
        encoder = new BinaryMessageEncoder<>(new GenericData(), schema);
    }

    @Override
    public byte[] serialize(String topic, GenericRecord data) {
        if (Objects.isNull(data)) {
            return null;
        }
        try {
            ByteBuffer bytes = encoder.encode(data);
            return bytes.array();
        } catch (IOException e) {
            throw new SinetStreamSerdeException(e);
        }
    }
}
