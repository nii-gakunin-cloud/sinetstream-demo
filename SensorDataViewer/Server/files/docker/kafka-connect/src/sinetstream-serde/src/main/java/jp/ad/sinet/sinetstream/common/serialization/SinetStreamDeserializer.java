package jp.ad.sinet.sinetstream.common.serialization;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.message.BinaryMessageDecoder;
import org.apache.kafka.common.serialization.Deserializer;

import java.io.IOException;
import java.nio.BufferUnderflowException;
import java.nio.ByteBuffer;
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
            ByteBuffer buf = ByteBuffer.wrap(data);
            if (isV3Message(buf)) {
                buf.position(SinetStreamSerde.V3_DATA_POS);
                buf = buf.slice();
            }
            return decoder.decode(buf);
        } catch (IOException | BufferUnderflowException e) {
            throw new SinetStreamSerdeException(e);
        }
    }

    private boolean isV3Message(ByteBuffer message) {
        ByteBuffer buf = message.slice();
        if (SinetStreamSerde.MARKER != buf.get()) {
            return false;
        }
        if (SinetStreamSerde.MESSAGE_VERSION != buf.get()) {
            return false;
        }
        if (0 != buf.getShort()) {
            return false;
        }
        if (0 != buf.getShort()) {
            return false;
        }
        return true;
    }
}