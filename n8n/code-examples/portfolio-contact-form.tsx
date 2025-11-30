// ========================================
// PORTFOLIO CONTACT FORM - Frontend Code
// ========================================

// src/types/contact.ts
export interface ContactFormData {
  name: string;
  email: string;
  service: 'mobile' | 'web' | 'automation' | 'ai' | 'notSure';
  budget: 'under5k' | '5k15k' | '15k50k' | '50kPlus' | 'notSure';
  message: string;
  newsletter?: boolean;
}

export interface ContactResponse {
  status: 'success' | 'error';
  message: string;
  contact_id?: string;
}

// ========================================
// src/services/contactService.ts
// ========================================

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/portfolio-contact';

export async function submitContactForm(data: ContactFormData): Promise<ContactResponse> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Contact form submission error:', error);
    return {
      status: 'error',
      message: 'Failed to send message. Please try again or contact me directly.',
    };
  }
}

// ========================================
// src/components/ContactForm.tsx
// ========================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { submitContactForm } from '@/services/contactService';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(255),
  service: z.enum(['mobile', 'web', 'automation', 'ai', 'notSure']),
  budget: z.enum(['under5k', '5k15k', '15k50k', '50kPlus', 'notSure']),
  message: z.string().min(20, 'Message must be at least 20 characters').max(1000),
  newsletter: z.boolean().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      const result = await submitContactForm(data);
      
      if (result.status === 'success') {
        toast.success('Message sent successfully! 🎉', {
          description: 'I\'ll get back to you within 24 hours.',
        });
        reset();
      } else {
        toast.error('Failed to send message', {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error('Something went wrong', {
        description: 'Please try again or email me directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          {...register('name')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Your name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="your.email@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Service Field */}
      <div>
        <label htmlFor="service" className="block text-sm font-medium">
          Service
        </label>
        <select
          {...register('service')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Select a service</option>
          <option value="mobile">Mobile App Development</option>
          <option value="web">Web Development</option>
          <option value="automation">AI Automation</option>
          <option value="ai">AI Agent Development</option>
          <option value="notSure">Not sure yet</option>
        </select>
        {errors.service && (
          <p className="mt-1 text-sm text-red-600">{errors.service.message}</p>
        )}
      </div>

      {/* Budget Field */}
      <div>
        <label htmlFor="budget" className="block text-sm font-medium">
          Budget
        </label>
        <select
          {...register('budget')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Select your budget</option>
          <option value="under5k">Under $5,000</option>
          <option value="5k15k">$5,000 - $15,000</option>
          <option value="15k50k">$15,000 - $50,000</option>
          <option value="50kPlus">$50,000+</option>
          <option value="notSure">Not sure yet</option>
        </select>
        {errors.budget && (
          <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
        )}
      </div>

      {/* Message Field */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          {...register('message')}
          rows={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Tell me about your project..."
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
        )}
      </div>

      {/* Newsletter Checkbox */}
      <div className="flex items-center">
        <input
          {...register('newsletter')}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="newsletter" className="ml-2 text-sm">
          Subscribe to newsletter for AI & automation tips
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

// ========================================
// .env.local
// ========================================

// Add this to your .env.local
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/portfolio-contact

// For production:
// NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook/portfolio-contact
