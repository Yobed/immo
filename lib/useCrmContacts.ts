'use client';

import { useCallback, useEffect, useState } from 'react';
import { INITIAL_CONTACTS } from './mock-data';
import type { Contact } from './types';

const STORAGE_KEY = 'crm_leads';
const UPDATE_EVENT = 'crm_leads_updated';

const normalizePhone = (phone: string) => phone.replace(/\s+/g, '');

/** Contacts stockés localement (prospects WhatsApp + modifications), complétés par la démo. */
function readContacts(): Contact[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    const stored = Array.isArray(parsed) ? (parsed as Contact[]) : [];
    const storedPhones = new Set(stored.map((c) => normalizePhone(c.phone)));
    return [...stored, ...INITIAL_CONTACTS.filter((c) => !storedPhones.has(normalizePhone(c.phone)))];
  } catch {
    return INITIAL_CONTACTS;
  }
}

function writeStored(contacts: Contact[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  } catch {
    // ponytail: stockage indisponible (navigation privée) : les changements restent en mémoire
  }
}

export function useCrmContacts() {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);

  useEffect(() => {
    const sync = () => setContacts(readContacts());
    sync();
    window.addEventListener(UPDATE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  /** Ajoute ou remplace un contact (clé : numéro de téléphone) et le persiste. */
  const upsertContact = useCallback((contact: Contact) => {
    const phone = normalizePhone(contact.phone);
    const next = [contact, ...readContacts().filter((c) => normalizePhone(c.phone) !== phone)];
    setContacts(next);
    writeStored(next);
  }, []);

  const updateContact = useCallback((id: string, patch: Partial<Contact>) => {
    const next = readContacts().map((c) => (c.id === id ? { ...c, ...patch } : c));
    setContacts(next);
    writeStored(next);
  }, []);

  return { contacts, upsertContact, updateContact };
}
