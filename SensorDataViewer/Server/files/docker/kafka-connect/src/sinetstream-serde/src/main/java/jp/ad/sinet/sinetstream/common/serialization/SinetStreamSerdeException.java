package jp.ad.sinet.sinetstream.common.serialization;

public class SinetStreamSerdeException extends RuntimeException {

    private static final long serialVersionUID = -1666353621547679721L;

    public SinetStreamSerdeException() {
        super();
    }

    public SinetStreamSerdeException(String message) {
        super(message);
    }

    public SinetStreamSerdeException(String message, Throwable cause) {
        super(message, cause);
    }

    public SinetStreamSerdeException(Throwable cause) {
        super(cause);
    }
}
