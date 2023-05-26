package jp.ad.sinet.sinetstream.common.serialization;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericRecord;
import org.apache.kafka.common.serialization.Deserializer;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.common.serialization.Serializer;

import java.io.IOException;
import java.util.Map;

public class SinetStreamSerde implements Serde<GenericRecord> {

    private final Serde<GenericRecord> inner;
    private final Schema schema;

    public SinetStreamSerde() {
        schema = createSchema();
        inner = Serdes.serdeFrom(new SinetStreamSerializer(schema), new SinetStreamDeserializer(schema));
    }

    private static Schema createSchema() {
        try {
            return new Schema.Parser().parse(
                    SinetStreamSerde.class.getResourceAsStream("/messageSchema.avsc"));
        } catch (IOException e) {
            throw new SinetStreamSerdeException(e);
        }
    }

    public Schema getSchema() {
        return schema;
    }

    @Override
    public Serializer<GenericRecord> serializer() {
        return inner.serializer();
    }

    @Override
    public Deserializer<GenericRecord> deserializer() {
        return inner.deserializer();
    }

    @Override
    public void configure(Map<String, ?> configs, boolean isKey) {
        inner.serializer().configure(configs, isKey);
        inner.deserializer().configure(configs, isKey);
    }

    @Override
    public void close() {
        inner.serializer().close();
        inner.deserializer().close();
    }
}