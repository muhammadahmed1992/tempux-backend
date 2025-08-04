export interface SocialLoginResponseDTO {
  id: number;
  email: string;
  userType: number;
}

export interface SocialLoginVerifyUserResponseDTO {
  resetToken: string;
}
