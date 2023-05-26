package jp.ad.sinet.sinetstream.connect.transforms;

import org.apache.kafka.connect.data.Date;
import org.apache.kafka.connect.data.*;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.transforms.TimestampConverter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

public class MicrosecondTimestampConverterTest {

    private static final TimeZone UTC = TimeZone.getTimeZone("UTC");
    private static final Calendar EPOCH;
    private static final Calendar TIME;
    private static final Calendar DATE;
    private static final Calendar DATE_PLUS_TIME;
    private static final long DATE_PLUS_TIME_UNIX;
    private static final long DATE_PLUS_TIME_UNIX_MICROS;
    private static final String STRING_DATE_FMT = "yyyy MM dd HH mm ss SSS z";
    private static final String DATE_PLUS_TIME_STRING;

    private final MicrosecondTimestampConverter<SourceRecord> xformValue = new MicrosecondTimestampConverter.Value<>();

    static {
        EPOCH = GregorianCalendar.getInstance(UTC);
        EPOCH.setTimeInMillis(0L);

        TIME = GregorianCalendar.getInstance(UTC);
        TIME.setTimeInMillis(0L);
        TIME.add(Calendar.MILLISECOND, 1234);

        DATE = GregorianCalendar.getInstance(UTC);
        DATE.setTimeInMillis(0L);
        DATE.set(1970, Calendar.JANUARY, 1, 0, 0, 0);
        DATE.add(Calendar.DATE, 1);

        DATE_PLUS_TIME = GregorianCalendar.getInstance(UTC);
        DATE_PLUS_TIME.setTimeInMillis(0L);
        DATE_PLUS_TIME.add(Calendar.DATE, 1);
        DATE_PLUS_TIME.add(Calendar.MILLISECOND, 1234);

        // 86 401 234 milliseconds
        DATE_PLUS_TIME_UNIX = DATE_PLUS_TIME.getTime().getTime();
        // 86 401 234 123 microseconds
        DATE_PLUS_TIME_UNIX_MICROS = DATE_PLUS_TIME_UNIX * 1000 + 123;

        DATE_PLUS_TIME_STRING = "1970 01 02 00 00 01 234 UTC";
    }

    @AfterEach
    public void teardown() {
        xformValue.close();
    }

    @Test
    public void testWithSchemaUnixToString() {
        Map<String, String> config = new HashMap<>();
        config.put(TimestampConverter.TARGET_TYPE_CONFIG, "string");
        config.put(TimestampConverter.FORMAT_CONFIG, STRING_DATE_FMT);
        xformValue.configure(config);
        SourceRecord transformed = xformValue.apply(createRecordWithSchema(Schema.INT64_SCHEMA, DATE_PLUS_TIME_UNIX_MICROS));

        assertEquals(Schema.STRING_SCHEMA, transformed.valueSchema());
        assertEquals(DATE_PLUS_TIME_STRING, transformed.value());
    }

    @Test
    public void testWithSchemaUnixToTimestamp() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "Timestamp"));
        SourceRecord transformed = xformValue.apply(createRecordWithSchema(Schema.INT64_SCHEMA, DATE_PLUS_TIME_UNIX_MICROS));

        assertEquals(Timestamp.SCHEMA, transformed.valueSchema());
        assertEquals(DATE_PLUS_TIME.getTime(), transformed.value());
    }

    @Test
    public void testWithSchemaUnixToDate() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "Date"));
        SourceRecord transformed = xformValue.apply(createRecordWithSchema(Schema.INT64_SCHEMA, DATE_PLUS_TIME_UNIX_MICROS));

        assertEquals(Date.SCHEMA, transformed.valueSchema());
        assertEquals(DATE.getTime(), transformed.value());
    }

    @Test
    public void testWithSchemaUnixToTime() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "Time"));
        SourceRecord transformed = xformValue.apply(createRecordWithSchema(Schema.INT64_SCHEMA, DATE_PLUS_TIME_UNIX_MICROS));

        assertEquals(Time.SCHEMA, transformed.valueSchema());
        assertEquals(TIME.getTime(), transformed.value());
    }

    @Test
    public void testWithSchemaUnixToUnix() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "unix"));
        SourceRecord transformed = xformValue.apply(createRecordWithSchema(Schema.INT64_SCHEMA, DATE_PLUS_TIME_UNIX_MICROS));

        assertEquals(Schema.INT64_SCHEMA, transformed.valueSchema());
        assertEquals(DATE_PLUS_TIME_UNIX, transformed.value());
    }

    @Test
    public void testWithSchemalessUnixToString() {
        Map<String, String> config = new HashMap<>();
        config.put(TimestampConverter.TARGET_TYPE_CONFIG, "string");
        config.put(TimestampConverter.FORMAT_CONFIG, STRING_DATE_FMT);
        xformValue.configure(config);
        SourceRecord transformed = xformValue.apply(createRecordSchemaless(DATE_PLUS_TIME_UNIX_MICROS));

        assertNull(transformed.valueSchema());
        assertEquals(DATE_PLUS_TIME_STRING, transformed.value());
    }

    @Test
    public void testWithSchemalessUnixToTimestamp() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "Timestamp"));
        SourceRecord transformed = xformValue.apply(createRecordSchemaless(DATE_PLUS_TIME_UNIX_MICROS));

        assertNull(transformed.valueSchema());
        assertEquals(DATE_PLUS_TIME.getTime(), transformed.value());
    }

    @Test
    public void testWithSchemalessUnixToDate() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "Date"));
        SourceRecord transformed = xformValue.apply(createRecordSchemaless(DATE_PLUS_TIME_UNIX_MICROS));

        assertNull(transformed.valueSchema());
        assertEquals(DATE.getTime(), transformed.value());
    }

    @Test
    public void testWithSchemalessUnixToTime() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "Time"));
        SourceRecord transformed = xformValue.apply(createRecordSchemaless(DATE_PLUS_TIME_UNIX_MICROS));

        assertNull(transformed.valueSchema());
        assertEquals(TIME.getTime(), transformed.value());
    }

    @Test
    public void testWithSchemalessUnixToUnix() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "unix"));
        SourceRecord transformed = xformValue.apply(createRecordSchemaless(DATE_PLUS_TIME_UNIX_MICROS));

        assertNull(transformed.valueSchema());
        assertEquals(DATE_PLUS_TIME_UNIX, transformed.value());
    }

    @Test
    public void testWithSchemaNullValueConversion() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "unix"));
        SourceRecord transformed = xformValue.apply(createRecordWithSchema(Schema.INT64_SCHEMA, null));

        assertEquals(Schema.INT64_SCHEMA, transformed.valueSchema());
        assertNull(transformed.value());
    }

    @Test
    public void testWithSchemalessNullValueConversion() {
        xformValue.configure(Collections.singletonMap(TimestampConverter.TARGET_TYPE_CONFIG, "unix"));
        SourceRecord transformed = xformValue.apply(createRecordSchemaless(null));

        assertNull(transformed.valueSchema());
        assertNull(transformed.value());
    }

    @Test
    public void testWithSchemaFieldConversion() {
        Map<String, String> config = new HashMap<>();
        config.put(TimestampConverter.TARGET_TYPE_CONFIG, "Timestamp");
        config.put(TimestampConverter.FIELD_CONFIG, "ts");
        xformValue.configure(config);
        SourceRecord transformed = xformValue.apply(createStructWithSchema(DATE_PLUS_TIME_UNIX_MICROS));

        Schema expectedSchema = SchemaBuilder.struct()
                .field("ts", Timestamp.SCHEMA)
                .field("other", Schema.STRING_SCHEMA)
                .build();
        assertEquals(expectedSchema, transformed.valueSchema());
        assertEquals(DATE_PLUS_TIME.getTime(), ((Struct) transformed.value()).get("ts"));
        assertEquals("test", ((Struct) transformed.value()).get("other"));
    }

    @Test
    public void testSchemalessFieldConversion() {
        Map<String, String> config = new HashMap<>();
        config.put(TimestampConverter.TARGET_TYPE_CONFIG, "Timestamp");
        config.put(TimestampConverter.FIELD_CONFIG, "ts");
        xformValue.configure(config);
        SourceRecord transformed = xformValue.apply(createStructSchemaless(DATE_PLUS_TIME_UNIX_MICROS));

        assertNull(transformed.valueSchema());
        assertEquals(DATE_PLUS_TIME.getTime(), ((Map<?, ?>) transformed.value()).get("ts"));
        assertEquals("test", ((Map<?, ?>) transformed.value()).get("other"));
    }

    private SourceRecord createRecordWithSchema(Schema schema, Object value) {
        return new SourceRecord(null, null, "topic", 0, schema, value);
    }

    private SourceRecord createRecordSchemaless(Object value) {
        return createRecordWithSchema(null, value);
    }

    private SourceRecord createStructWithSchema(Object value) {
        Schema structWithTimestampFieldSchema = SchemaBuilder.struct()
                .field("ts", Schema.INT64_SCHEMA)
                .field("other", Schema.STRING_SCHEMA)
                .build();
        Struct original = new Struct(structWithTimestampFieldSchema);
        original.put("ts", value);
        original.put("other", "test");
        return createRecordWithSchema(structWithTimestampFieldSchema, original);
    }

    private SourceRecord createStructSchemaless(Object value) {
        Map<String, Object> values = new HashMap<>();
        values.put("ts", value);
        values.put("other", "test");
        return createRecordWithSchema(null, values);
    }
}
