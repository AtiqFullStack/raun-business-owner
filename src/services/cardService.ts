import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';

export type UserCard = {
  _id: string;
  userAuthId: string;
  cardNumberLast4: string;
  cardNumberMasked: string;
  expiryMonth: string;
  expiryYear: string;
  cardHolderName?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCardPayload = {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardHolderName?: string;
  isDefault?: boolean;
};

export type CardResponse = {
  card: UserCard;
};

export type CardsResponse = {
  cards: UserCard[];
};

export const getCardExpiry = (card: UserCard) =>
  `${card.expiryMonth}/${card.expiryYear}`;

export const useCardService = () => {
  const { fetchData, loading, error, clearError } = useAxios();

  const createCard = useCallback(
    (data: CreateCardPayload) => {
      return fetchData<CardResponse>({
        url: '/api/user/card',
        method: 'POST',
        data,
        service: false,
      });
    },
    [fetchData],
  );

  const getCards = useCallback(() => {
    return fetchData<CardsResponse>({
      url: '/api/user/card',
      method: 'GET',
      service: false,
    });
  }, [fetchData]);

  const getCardById = useCallback(
    (cardId: string) => {
      return fetchData<CardResponse>({
        url: `/api/user/card/${cardId}`,
        method: 'GET',
        service: false,
      });
    },
    [fetchData],
  );

  const setDefaultCard = useCallback(
    (cardId: string) => {
      return fetchData<CardResponse>({
        url: `/api/user/card/${cardId}/default`,
        method: 'PATCH',
        service: false,
      });
    },
    [fetchData],
  );

  const deleteCard = useCallback(
    (cardId: string) => {
      return fetchData<CardResponse>({
        url: `/api/user/card/${cardId}`,
        method: 'DELETE',
        service: false,
      });
    },
    [fetchData],
  );

  return {
    createCard,
    getCards,
    getCardById,
    setDefaultCard,
    deleteCard,
    loading,
    error,
    clearError,
  };
};
