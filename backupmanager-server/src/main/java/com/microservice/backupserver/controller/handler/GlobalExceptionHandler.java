package com.microservice.backupserver.controller.handler;

import com.microservice.backupserver.application.exceptions.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDate;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<StandardError> buildResponse(
            HttpStatus status,
            String error,
            String message,
            HttpServletRequest request
    ) {
        StandardError response = new StandardError(
                LocalDate.now(),
                status.value(),
                error,
                message,
                request.getRequestURI()
        );

        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<StandardError> handleEntityNotFound(
            EntityNotFoundException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "Resource Not Found",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(EntityAlreadyExistsException.class)
    public ResponseEntity<StandardError> handleEntityAlreadyExists(
            EntityAlreadyExistsException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "Resource Already Exists",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<StandardError> handleUserNotFound(
            UserNotFoundException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "User Not Found",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<StandardError> handleUserAlreadyExists(
            UserAlreadyExistsException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "User Already Exists",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(InactiveUserException.class)
    public ResponseEntity<StandardError> handleInactiveUser(
            InactiveUserException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "Inactive User",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<StandardError> handleInvalidCredentials(
            InvalidCredentialsException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Invalid Credentials",
                "Invalid username or password.",
                request
        );
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<StandardError> handleInvalidToken(
            InvalidTokenException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Invalid Token",
                "The provided token is invalid or expired.",
                request
        );
    }

    @ExceptionHandler(SessionRevokedException.class)
    public ResponseEntity<StandardError> handleSessionRevoked(
            SessionRevokedException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Session Revoked",
                "This session is no longer valid. Please authenticate again.",
                request
        );
    }

    @ExceptionHandler(RefreshTokenSaveException.class)
    public ResponseEntity<StandardError> handleRefreshTokenSave(
            RefreshTokenSaveException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Authentication Service Unavailable",
                "Unable to establish the authentication session.",
                request
        );
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<StandardError> handleBusinessRule(
            BusinessRuleException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Business Rule Violation",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<StandardError> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid Argument",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<StandardError> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String errorMessages = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fieldError ->
                        fieldError.getField() + ": " + fieldError.getDefaultMessage()
                )
                .collect(Collectors.joining("; "));

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Validation Error",
                errorMessages,
                request
        );
    }

    @ExceptionHandler(StorageOperationException.class)
    public ResponseEntity<StandardError> handleStorageOperation(
            StorageOperationException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_GATEWAY,
                "Storage Gateway Error",
                "Failed to communicate with the file storage service.",
                request
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<StandardError> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                "An unexpected internal server error occurred.",
                request
        );
    }
}