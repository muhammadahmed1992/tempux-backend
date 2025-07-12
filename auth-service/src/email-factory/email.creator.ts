import { EmailMessage } from "./email.message.interface";

export abstract class EmailCreator {
  /**
   * The factory method declares a method for producing EmailMessage objects.
   * The 'data' parameter will be specific to each email type.
   */
  public abstract factoryMethod(data: any): EmailMessage;
}
