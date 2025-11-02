// types/paystack-api.d.ts
declare module 'paystack-api' {
  interface TransactionInitializeParams {
    amount: number;
    email: string;
    currency?: string;
    reference: string;
    metadata?: Record<string, any>;
    callback_url?: string;
  }

  interface TransactionInitializeResponse {
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }

  interface TransactionVerifyResponse {
    status: boolean;
    message: string;
    data: {
      id: number;
      status: string;
      reference: string;
      amount: number;
      currency: string;
      metadata?: {
        plan_type?: string;
        user_id?: string;
        clerk_user_id?: string;
      };
      customer: {
        email: string;
      };
    };
  }

  interface Transaction {
    initialize(params: TransactionInitializeParams): Promise<TransactionInitializeResponse>;
    verify(reference: string): Promise<TransactionVerifyResponse>;
  }

  interface PaystackInstance {
    transaction: Transaction;
  }

  function Paystack(secretKey: string): PaystackInstance;
  
  export default Paystack;
}