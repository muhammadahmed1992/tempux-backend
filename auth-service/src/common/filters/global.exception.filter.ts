import Meta from "@Helper/meta";
import ResponseHelper from "@Helper/response-helper";
import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  ExceptionFilter,
} from "@nestjs/common";
// Import Request and Response from express
import { Request, Response } from "express";

/**
 * A global exception filter that catches all unhandled exceptions
 * and formats the response consistently.
 */
@Catch() // @Catch() without arguments catches all exceptions
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine the HTTP status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine the error message
    let message: string | string[];
    let errorResponse: any;

    if (exception instanceof HttpException) {
      errorResponse = exception.getResponse(); // Get the original error response from HttpException
      if (typeof errorResponse === "string") {
        message = errorResponse; // If it's a simple string message
      } else if (typeof errorResponse === "object" && errorResponse !== null) {
        // For validation errors or other structured HttpExceptions
        message = errorResponse.message || "An unexpected error occurred.";
      } else {
        message = "An unexpected HTTP error occurred.";
      }
    } else if (exception instanceof Error) {
      message = exception.message; // For generic JavaScript Errors
    } else {
      message = "An unknown server error occurred."; // For anything else
    }

    // Log the full exception for debugging purposes (in development)
    console.error("--- Auth Service Global Exception Caught ---");
    console.error("Path:", request.url);
    console.error("Status:", status);
    console.error("Exception Type:", (exception as any).name || "Unknown");
    console.error("Exception Details:", exception);
    console.error("-----------------------------");

    // Construct the consistent error response payload

    const errorResposne = ResponseHelper.CreateResponse<any>(
      message,
      request.originalUrl,
      status
    );
    // Send the response
    response.status(status).json(errorResposne);
  }
}
