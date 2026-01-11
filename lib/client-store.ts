import { stat } from "fs";
import {create} from "zustand";

export type Variant = {
    variantID: number;
    quantity: number;
}

export type CartItem = {
    name: string;
    image: string;
    id: number;
    variant: Variant;
    price: number
}

export type CartState = {
    cart: CartItem[]
    checkoutProgress: "cart-page" | "payment-page" | "confirmation-page"
    setCheckoutProgress: (val: "cart-page" | "payment-page" | "confirmation-page") =>void 
    addToCart: (item:CartItem) => void
}

export const useCartStore = create<CartState>((set) => ({
    cart: [],
    checkoutProgress: "cart-page",
    setCheckoutProgress: (val) => set((state) => ({checkoutProgress: val})),
    addToCart: (item) => set((state) => {
        const existingItem = state.cart.find((cartItem) => cartItem.variant.variantID === item.variant.variantID)

        if(existingItem){
            const updatedCart = state.cart.map((cartItem) => {
                if(cartItem.variant.variantID === item.variant.variantID){
                    return{
                        ...cartItem,
                        variant: {
                            ...cartItem.variant,
                            quantity: cartItem.variant.quantity + item.variant.quantity
                        }
                    }
                }

                return cartItem;
            })
            return {cart: updatedCart}
        } else {
            return {cart: [...state.cart, {...item, variant: {variantID: item.variant.variantID, quantity: item.variant.quantity}}]}
        }
    })
}))