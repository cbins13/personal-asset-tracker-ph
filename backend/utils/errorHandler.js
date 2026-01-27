const isProduction = process.env.NODE_ENV === 'production';

const SENSITIVE_PATTERNS = [
  /account type/i,
  /validation/i,
  /cast to ObjectId/i,
  /mongo/i,
  /duplicate key/i,
];

const DEFAULT_MESSAGE = 'An error occurred. Please try again later.';

function isSensitive(message = '') {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(message));
}

export function sanitizeErrorMessage(message, fallbackMessage = DEFAULT_MESSAGE) {
  const safeMessage = message || fallbackMessage;
  if (!isProduction) {
    return safeMessage;
  }

  if (isSensitive(safeMessage)) {
    if (/account type/i.test(safeMessage)) {
      return 'Invalid account type selected. Please choose a valid account type.';
    }
    if (/validation/i.test(safeMessage)) {
      return 'Please check your input and try again.';
    }
    return DEFAULT_MESSAGE;
  }

  return safeMessage;
}

export function buildErrorResponse({
  error,
  message,
  fallbackMessage,
  code,
} = {}) {
  const safeMessage = sanitizeErrorMessage(message || error?.message, fallbackMessage);
  const response = {
    success: false,
    error: safeMessage,
  };

  if (code) {
    response.code = code;
  }

  if (!isProduction && error?.message) {
    response.details = error.message;
  }

  return response;
}

export function logError(context, error) {
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }
}

export function sendErrorResponse(res, options = {}) {
  const { status = 500, context, error, message, fallbackMessage, code } = options;
  logError(context, error);
  return res.status(status).json(
    buildErrorResponse({
      error,
      message,
      fallbackMessage,
      code,
    })
  );
}
