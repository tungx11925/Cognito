import { apiFetch } from '@/services/api';

export interface SubscriptionPlan {
  id: number;
  code: string;
  name: string;
  price: number | string;
  currency: string;
  interval: string;
  features: {
    ai_chat_daily?: number;
    ai_questions_daily?: number;
    max_documents?: number;
    document_max_pages?: number;
    priority_ai?: boolean;
    [key: string]: any;
  };
  is_active: boolean;
}

export interface UserSubscriptionInfo {
  subscription: {
    id: number;
    user_id: number;
    plan_id: number;
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED';
    start_date: string;
    end_date: string;
    cancelled_at: string | null;
    past_due_until: string | null;
    auto_renew: boolean;
    plan_code?: string;
    plan_name?: string;
    features?: any;
  } | null;
  is_premium: boolean;
  premium_until: string | null;
  usage: {
    usage_date: string;
    ai_question_gens: number;
    ai_chat_messages: number;
    documents_uploaded: number;
  };
}

export interface CheckoutResponse {
  orderCode: string;
  amount: number;
  currency: string;
  planCode: string;
  planName: string;
  checkoutUrl: string;
  gateway: 'PAYOS' | 'SANDBOX';
}

export interface PaymentOrderStatus {
  id: number;
  order_code: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  payment_gateway: string;
  paid_at: string | null;
  plan_code?: string;
  plan_name?: string;
}

class PaymentService {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const json = await apiFetch('/payment/plans');
    if (json?.error) {
      throw new Error(json.error || 'Không thể tải danh sách gói cước');
    }
    return json.data || [];
  }

  async getMySubscription(): Promise<UserSubscriptionInfo> {
    const json = await apiFetch('/payment/subscription/me');
    if (json?.error) {
      throw new Error(json.error || 'Không thể tải thông tin gói cước');
    }
    return json.data;
  }

  async createCheckout(planCode: string): Promise<CheckoutResponse> {
    const json = await apiFetch('/payment/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planCode }),
    });
    if (json?.error) {
      throw new Error(json.error || 'Không thể tạo đơn thanh toán');
    }
    return json.data;
  }

  async cancelSubscription(): Promise<{ success: boolean; message: string; end_date: string }> {
    const json = await apiFetch('/payment/subscription/cancel', {
      method: 'POST',
    });
    if (json?.error) {
      throw new Error(json.error || 'Không thể hủy gói đăng ký');
    }
    return json;
  }

  async getOrderStatus(orderCode: string): Promise<PaymentOrderStatus> {
    const json = await apiFetch(`/payment/orders/${orderCode}/status`);
    if (json?.error) {
      throw new Error(json.error || 'Không thể tra cứu trạng thái đơn hàng');
    }
    return json.data;
  }
}

export const paymentService = new PaymentService();
