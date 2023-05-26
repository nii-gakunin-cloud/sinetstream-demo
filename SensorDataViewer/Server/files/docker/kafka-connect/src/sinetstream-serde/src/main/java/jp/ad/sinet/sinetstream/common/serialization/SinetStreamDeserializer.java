package jp.ad.sinet.sinetstream.common.serialization;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.message.BinaryMessageDecoder;
import org.apache.kafka.common.serialization.Deserializer;

import java.io.IOException;
import java.util.Objects;

public class SinetStreamDeserializer implements Deserializer<GenericRecord> {

    private final BinaryMessageDecoder<GenericRecord> decoder;

    SinetStreamDeserializer(Schema schema) {
        decoder = new BinaryMessageDecoder<>(new GenericData(), schema);
    }

    @Override
    public GenericRecord deserialize(String topic, byte[] data) {
        if (Objects.isNull(data)) {
            return null;
        }
        try {
            return decoder.decode(data);
        } catch (IOException e) {
            throw new SinetStreamSerdeException(e);
        }
    }
}