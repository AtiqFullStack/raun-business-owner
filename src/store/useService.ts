import { create } from 'zustand';
import type { Service } from '../services/serviceService';

type ServiceState = {
  services: Service[];
  selectedServiceId?: string;
  selectedService?: Service;
  setServices: (services: Service[]) => void;
  setSelectedService: (serviceId: string) => void;
};

export const useServiceStore = create<ServiceState>(set => ({
  services: [],
  selectedServiceId: undefined,
  selectedService: undefined,
  setServices: services => {
    set(state => {
      const selectedService =
        services.find(service => service._id === state.selectedServiceId) ??
        services[0];

      return {
        services,
        selectedServiceId: selectedService?._id,
        selectedService,
      };
    });
  },
  setSelectedService: serviceId => {
    set(state => {
      const selectedService = state.services.find(
        service => service._id === serviceId,
      );

      if (!selectedService) {
        return state;
      }

      return {
        selectedServiceId: serviceId,
        selectedService,
      };
    });
  },
}));
