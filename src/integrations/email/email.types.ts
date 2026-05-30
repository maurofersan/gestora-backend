export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export type SendEmailResult = {
  sent: boolean;
  providerId?: string;
};
