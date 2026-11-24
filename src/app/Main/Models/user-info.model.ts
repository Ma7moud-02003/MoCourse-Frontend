export interface UserInfoModel {
    id: number;
  fullName: string;
  email: string;
  role: string;
  avatar: string;
  isVerified: boolean;

}

export interface InstractorInfo{
   personalInfo:UserInfoModel
  paymentInfo:{
  instapay: string;
  vodafoneCash: string;
  orangeCash: string;
  bankAccount: string;
  ownerName: string;
  }

}