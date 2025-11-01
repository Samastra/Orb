declare module 'paystack' {
  interface InitializeTransactionParams {
    amount: number;
    email: string;
    currency?: string;
    reference?: string;
    metadata?: Record<string, any>;
    callback_url?: string;
  }

  interface InitializeTransactionResponse {
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }

  interface VerifyTransactionResponse {
    status: boolean;
    message: string;
    data: {
      id: number;
      domain: string;
      status: string;
      reference: string;
      amount: number;
      currency: string;
      metadata: Record<string, any>;
      customer: {
        id: number;
        email: string;
      };
      created_at: string;
      paid_at: string;
    };
  }

  interface Transaction {
    initialize(params: InitializeTransactionParams): Promise<InitializeTransactionResponse>;
    verify(reference: string): Promise<VerifyTransactionResponse>;
  }

  interface Paystack {
    (secretKey: string): {
      transaction: Transaction;
    };
  }

  const paystack: Paystack;
  export default paystack;
}