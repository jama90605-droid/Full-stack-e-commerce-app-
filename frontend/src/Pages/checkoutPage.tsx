import './checkout.css';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { FiCheck, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import {
  useCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '../hooks/useShop';
import type { CartItem } from '../types';
import { formatPrice, getImageSrc, getOrderSummary } from '../utils';
import { CheckoutHeader } from './CheckoutHeader';
import { Footer } from './Footer';

interface CartItemCardProps {
  item: CartItem;
  deliveryDate: string;
  disabled: boolean;
  onQuantityChange: (item: CartItem, change: number) => void;
  onRemove: (productId: string) => void;
}

function CartItemCard({
  item,
  deliveryDate,
  disabled,
  onQuantityChange,
  onRemove,
}: CartItemCardProps) {
  const product = item.product;
  const itemTotal = product.priceCents * item.quantity;

  return (
    <div className="cart-item-container">
      <div className="delivery-date">Delivery date: {deliveryDate}</div>

      <div className="cart-item-details-grid">
        <img
          className="product-image"
          src={getImageSrc(product.image)}
          alt={product.name}
        />

        <div className="cart-item-details">
          <div className="product-name">{product.name}</div>
          <div className="product-price">{formatPrice(product.priceCents)}</div>

          <div className="product-quantity">
            <div className="quantity-controls" aria-label="Item quantity controls">
              <button
                type="button"
                className="quantity-button"
                aria-label={`Decrease quantity of ${product.name}`}
                onClick={() => onQuantityChange(item, -1)}
                disabled={disabled}
              >
                <FiMinus />
              </button>

              <div className="quantity-item">{item.quantity}</div>

              <button
                type="button"
                className="quantity-button"
                aria-label={`Increase quantity of ${product.name}`}
                onClick={() => onQuantityChange(item, 1)}
                disabled={disabled}
              >
                <FiPlus />
              </button>
            </div>

            <button
              type="button"
              className="delete-quantity-link"
              aria-label={`Remove ${product.name} from cart`}
              onClick={() => onRemove(product.id)}
              disabled={disabled}
            >
              <span className="delete-icon-wrap" aria-hidden="true">
                <FiTrash2 className="delete-icon" />
              </span>
              <span className="delete-label">Remove</span>
            </button>
          </div>
        </div>

        <div className="line-item-total">{formatPrice(itemTotal)}</div>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { data: cart = [], isLoading, isError, error } = useCartQuery();
  const updateCartItemMutation = useUpdateCartItemMutation();
  const removeCartItemMutation = useRemoveCartItemMutation();

  const summary = getOrderSummary(cart);
  const estimatedDeliveryDate = dayjs().add(5, 'day').format('dddd, MMMM D');
  const isUpdatingCart =
    updateCartItemMutation.isPending || removeCartItemMutation.isPending;

  const handleQuantityChange = (item: CartItem, change: number) => {
    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
      removeCartItemMutation.mutate(item.product.id);
      return;
    }

    updateCartItemMutation.mutate({
      productId: item.product.id,
      quantity: newQuantity,
    });
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    window.setTimeout(() => navigate('/stripe'), 900);
  };

  if (isLoading) {
    return <div className="checkout-page">Loading cart...</div>;
  }

  if (isError) {
    return (
      <div className="checkout-page">
        Error loading cart: {error?.message ?? 'Something went wrong'}
      </div>
    );
  }

  return (
    <>
      <title>Checkout</title>
      <CheckoutHeader totalQuantity={summary.totalQuantity} />

      <div className="checkout-page">
        <div className="page-title">Review your order</div>

        <div className="checkout-grid">
          <div className="order-summary">
            {cart.length === 0 ? (
              <div className="cart-item-container empty-cart-message">
                Your cart is empty. <Link to="/">Continue shopping</Link>
              </div>
            ) : (
              cart.map((item) => (
                <CartItemCard
                  key={item.product.id}
                  item={item}
                  deliveryDate={estimatedDeliveryDate}
                  disabled={isUpdatingCart}
                  onQuantityChange={handleQuantityChange}
                  onRemove={(productId) => removeCartItemMutation.mutate(productId)}
                />
              ))
            )}
          </div>

          <div className="payment-summary">
            <div className="payment-summary-title">Payment Summary</div>

            <div className="payment-summary-row">
              <div>Items ({summary.totalQuantity}):</div>
              <div className="payment-summary-money">
                {formatPrice(summary.itemsTotal)}
              </div>
            </div>

            <div className="payment-summary-row">
              <div>Shipping &amp; handling:</div>
              <div className="payment-summary-money">
                {formatPrice(summary.shippingTotal)}
              </div>
            </div>

            <div className="payment-summary-row subtotal-row">
              <div>Total before tax:</div>
              <div className="payment-summary-money">
                {formatPrice(summary.subtotal)}
              </div>
            </div>

            <div className="payment-summary-row">
              <div>Estimated tax (10%):</div>
              <div className="payment-summary-money">{formatPrice(summary.tax)}</div>
            </div>

            <div className="payment-summary-row total-row">
              <div>Order total:</div>
              <div className="payment-summary-money">
                {formatPrice(summary.orderTotal)}
              </div>
            </div>

            <button
              type="button"
              className="place-order-button button-primary"
              disabled={cart.length === 0 || isUpdatingCart || orderPlaced}
              onClick={handlePlaceOrder}
            >
              {orderPlaced ? (
                <span className="button-success">
                  <FiCheck style={{ marginRight: '8px' }} />
                  Order Placed!
                </span>
              ) : (
                'Place Your Order'
              )}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
