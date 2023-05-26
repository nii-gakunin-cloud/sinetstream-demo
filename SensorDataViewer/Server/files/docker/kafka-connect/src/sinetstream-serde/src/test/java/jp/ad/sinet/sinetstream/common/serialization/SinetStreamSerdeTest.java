package jp.ad.sinet.sinetstream.common.serialization;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SinetStreamSerdeTest {

    @Test
    void getSchema() {
        SinetStreamSerde serde = new SinetStreamSerde();
        assertNotNull(serde.getSchema());
    }

    @Test
    void serializer() {
        SinetStreamSerde serde = new SinetStreamSerde();
        assertNotNull(serde.serializer());
    }

    @Test
    void deserializer() {
        SinetStreamSerde serde = new SinetStreamSerde();
        assertNotNull(serde.deserializer());
    }
}