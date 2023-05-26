package jp.ad.sinet.sinetstream.connect.converters;

import java.nio.ByteBuffer;
import java.util.Map;

import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericRecord;
import org.apache.kafka.common.errors.SerializationException;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaAndValue;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.errors.DataException;
import org.apache.kafka.connect.storage.Converter;

import io.confluent.connect.avro.AvroData;
import io.confluent.connect.avro.AvroDataConfig;
import jp.ad.sinet.sinetstream.common.serialization.SinetStreamSerde;

public class SinetStreamConverter implements Converter {

    private final SinetStreamSerde serde;
    private AvroData avroData;

    public SinetStreamConverter() {
        serde = new SinetStreamSerde();
    }

    @Override
    public void configure(Map<String, ?> configs, boolean isKey) {
        avroData = new AvroData(new AvroDataConfig(configs));
    }

    @Override
    public byte[] fromConnectData(String topic, Schema schema, Object value) {
        if (value == null) {
            return null;
        }
        GenericRecord record;
        if (value instanceof GenericRecord) {
            record = (GenericRecord) value;
        } else {
            record = new GenericData.Record(serde.getSchema());
            Object tstamp;
            Object msg;
            if (value instanceof Map) {
                Map<?, ?> params = (Map<?, ?>) value;
                tstamp = params.get("tstamp");
                msg = params.get("msg");
            } else if (value instanceof Struct) {
                Struct params = (Struct) value;
                tstamp = params.get("tstamp");
                msg = params.get("msg");
            } else {
                throw new DataException("Java class " + value.getClass() + " does not have corresponding schema type.");
            }
            if (msg instanceof byte[]) {
                msg = ByteBuffer.wrap((byte[]) msg);
            }
            record.put("tstamp", tstamp);
            record.put("msg", msg);
        }
        try {
            return serde.serializer().serialize(topic, record);
        } catch (SerializationException e) {
            throw new DataException("Converting Kafka Connect data to byte[] failed due to serialization error: ", e);
        }
    }

    @Override
    public SchemaAndValue toConnectData(String topic, byte[] value) {
        if (value == null) {
            return SchemaAndValue.NULL;
        }
        try {
            GenericRecord data = serde.deserializer().deserialize(topic, value);
            return avroData.toConnectData(serde.getSchema(), data);
        } catch (SerializationException e) {
            throw new DataException("Converting byte[] to Kafka Connect data failed due to serialization error: ", e);
        }
    }
}
