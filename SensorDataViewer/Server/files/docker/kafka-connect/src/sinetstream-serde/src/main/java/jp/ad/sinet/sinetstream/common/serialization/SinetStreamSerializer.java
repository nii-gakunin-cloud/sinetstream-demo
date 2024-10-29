package jp.ad.sinet.sinetstream.common.serialization;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.message.BinaryMessageEncoder;
import org.apache.kafka.common.config.ConfigException;
import org.apache.kafka.common.serialization.Serializer;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Map;
import java.util.Objects;

public class SinetStreamSerializer implements Serializer<GenericRecord> {

    private static final int MIN_SUPPORTED_VERSION = 2;
    private static final int MAX_SUPPORTED_VERSION = 3;

    private final BinaryMessageEncoder<GenericRecord> encoder;
    private int formatVersion = SinetStreamSerde.MESSAGE_VERSION;

    SinetStreamSerializer(Schema schema) {
        encoder = new BinaryMessageEncoder<>(new GenericData(), schema);
    }

    @Override
    public byte[] serialize(String topic, GenericRecord data) {
        if (Objects.isNull(data)) {
            return null;
        }
        try {
            ByteBuffer v2msg = encoder.encode(data);
            if (formatVersion == 2) {
                return v2msg.array();
            }
            return toV3Message(v2msg);
        } catch (IOException e) {
            throw new SinetStreamSerdeException(e);
        }
    }

    private byte[] toV3Message(ByteBuffer v2msg) {
        ByteBuffer msg = ByteBuffer.allocate(v2msg.remaining() + SinetStreamSerde.V3_DATA_POS);
        msg.put(SinetStreamSerde.MARKER);
        msg.put((byte) SinetStreamSerde.MESSAGE_VERSION);
        msg.put((byte) 0);
        msg.put((byte) 0);
        msg.putShort((short) 0);
        msg.put(v2msg);
        return msg.array();
    }

    @Override
    public void configure(Map<String, ?> configs, boolean isKey) {
        configureFormatVersion(configs, isKey);
    }

    private void configureFormatVersion(Map<String, ?> configs, boolean isKey) {
        final String property = SinetStreamSerde.MESSAGE_FORMAT_CONFIG;
        final Object value = configs.get(property);
        if (value == null) {
            return;
        }
        final int version;
        try {
            if (value instanceof Number) {
                version = ((Number) value).intValue();
            } else if (value instanceof String) {
                version = Integer.parseInt((String) value);
            } else {
                throw new ConfigException(property, value, "Invalid type for configuration value");
            }
        } catch (IllegalArgumentException e) {
            throw new ConfigException(property, value, "Invalid format for configuration value: " + e.getMessage());
        }
        if (version < MIN_SUPPORTED_VERSION || version > MAX_SUPPORTED_VERSION) {
            throw new ConfigException(property, value, "Unsupported format version");
        }
        this.formatVersion = version;
    }
}
