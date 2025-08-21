export class FedExOAuthRequestDto {
  grant_type!: string;
  client_id!: string;
  client_secret!: string;
}

export class FedExOAuthResponseDto {
  access_token!: string;
  token_type!: string;
  expires_in!: number;
  scope!: string;
}
