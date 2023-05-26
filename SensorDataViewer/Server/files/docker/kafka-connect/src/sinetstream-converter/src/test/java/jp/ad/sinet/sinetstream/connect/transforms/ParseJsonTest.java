package jp.ad.sinet.sinetstream.connect.transforms;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.source.SourceRecord;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class ParseJsonTest {
    private final ParseJson<SourceRecord> xformValue = new ParseJson.Value<>();

    private static final String JSON_TEXT = "{\"label\": \"test-01\", \"value\": 12}";
    private static final byte[] JSON_BYTES = JSON_TEXT.getBytes(StandardCharsets.UTF_8);
    private static final ByteBuffer JSON_BYTE_BUFFER = ByteBuffer.wrap(JSON_BYTES);

    @AfterEach
    public void teardown() {
        xformValue.close();
    }

    @Test
    public void testByteArray() {
        xformValue.configure(Collections.emptyMap());
        SourceRecord transformed = xformValue.apply(createRecordWithSchema(Schema.BYTES_SCHEMA, JSON_BYTES));
        assertNull(transformed.valueSchema());
        assertInstanceOf(Map.class, transformed.value());
        assertEquals("test-01", ((Map<?, ?>) transformed.value()).get("label"));
        assertEquals(12L, ((Map<?, ?>) transformed.value()).get("value"));
    }

    @Test
    public void testByteBuffer() {
        xformValue.configure(Collections.emptyMap());
        SourceRecord transformed = xformValue.apply(createRecordWithSchema(Schema.BYTES_SCHEMA, JSON_BYTE_BUFFER));
        assertNull(transformed.valueSchema());
        assertInstanceOf(Map.class, transformed.value());
        assertEquals("test-01", ((Map<?, ?>) transformed.value()).get("label"));
        assertEquals(12L, ((Map<?, ?>) transformed.value()).get("value"));
    }

    @Test
    public void testString() {
        xformValue.configure(Collections.emptyMap());
        SourceRecord transformed = xformValue.apply(createRecordWithSchema(Schema.STRING_SCHEMA, JSON_TEXT));
        assertNull(transformed.valueSchema());
        assertInstanceOf(Map.class, transformed.value());
        assertEquals("test-01", ((Map<?, ?>) transformed.value()).get("label"));
        assertEquals(12L, ((Map<?, ?>) transformed.value()).get("value"));
    }

    @Test
    public void testStruct() {
        xformValue.configure(Collections.singletonMap(ParseJson.FIELD_CONFIG, "msg"));
        SourceRecord transformed = xformValue.apply(createStructWithSchema(0L));

        assertNull(transformed.valueSchema());
        assertInstanceOf(Map.class, transformed.value());
        Object val = ((Map<?, ?>) transformed.value()).get("msg");
        assertInstanceOf(Map.class, val);
        assertEquals("test-01", ((Map<?, ?>) val).get("label"));
        assertEquals(12L, ((Map<?, ?>) val).get("value"));
    }

    @Test
    public void testMap() {
        xformValue.configure(Collections.singletonMap(ParseJson.FIELD_CONFIG, "msg"));
        SourceRecord transformed = xformValue.apply(createMapSchemaless(0L));

        assertNull(transformed.valueSchema());
        assertInstanceOf(Map.class, transformed.value());
        Object val = ((Map<?, ?>) transformed.value()).get("msg");
        assertInstanceOf(Map.class, val);
        assertEquals("test-01", ((Map<?, ?>) val).get("label"));
        assertEquals(12L, ((Map<?, ?>) val).get("value"));
    }

    private SourceRecord createRecordWithSchema(Schema schema, Object value) {
        return new SourceRecord(null, null, "topic", 0, schema, value);
    }

    private SourceRecord createStructWithSchema(Object value) {
        Schema structWithTimestampFieldSchema = SchemaBuilder.struct()
                .field("ts", Schema.INT64_SCHEMA)
                .field("msg", Schema.BYTES_SCHEMA)
                .build();
        Struct original = new Struct(structWithTimestampFieldSchema);
        original.put("ts", value);
        original.put("msg", JSON_BYTES);
        return createRecordWithSchema(structWithTimestampFieldSchema, original);
    }

    private SourceRecord createMapSchemaless(Object value) {
        Map<String, Object> params = new HashMap<>();
        params.put("ts", value);
        params.put("msg", JSON_BYTES);
        return createRecordWithSchema(null, params);
    }
}
