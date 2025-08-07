export interface SocialLoginResponseDTO {
  id: number;
  email: string;
  userRoles: number[];
}

export interface SocialLoginVerifyUserResponseDTO {
  resetToken: string;
}
