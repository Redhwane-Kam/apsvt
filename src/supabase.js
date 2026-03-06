import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://novgnuulcpfabrtowkuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdmdudXVsY3BmYWJydG93a3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODUwMTAsImV4cCI6MjA4ODM2MTAxMH0.zyqT8HTz2gHKvMORQMn0spGBudF4_CjREhPllYC2ieY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Helpers génériques ────────────────────────────────────────────

export const db = {

  // PARAMÈTRES
  async getParam(cle) {
    const { data } = await supabase.from('parametres').select('valeur').eq('cle', cle).single();
    return data?.valeur ?? null;
  },
  async setParam(cle, valeur) {
    await supabase.from('parametres').update({ valeur, updated_at: new Date() }).eq('cle', cle);
  },

  // MEMBRES
  async getMembres() {
    const { data } = await supabase.from('membres').select('*').order('nom');
    return data ?? [];
  },
  async addMembre(m) {
    const { data, error } = await supabase.from('membres').insert([m]).select().single();
    return { data, error };
  },
  async updateMembre(id, changes) {
    await supabase.from('membres').update(changes).eq('id', id);
  },
  async deleteMembre(id) {
    await supabase.from('membres').delete().eq('id', id);
  },
  async getMembreByEmail(email) {
    const { data } = await supabase.from('membres').select('*').eq('email', email).single();
    return data;
  },

  // TRANSACTIONS
  async getTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    return data ?? [];
  },
  async addTransaction(t) {
    const { data, error } = await supabase.from('transactions').insert([t]).select().single();
    return { data, error };
  },
  async deleteTransaction(id) {
    await supabase.from('transactions').delete().eq('id', id);
  },

  // DONS
  async getDons() {
    const { data } = await supabase.from('dons').select('*').order('date', { ascending: false });
    return data ?? [];
  },
  async addDon(d) {
    const { data, error } = await supabase.from('dons').insert([d]).select().single();
    return { data, error };
  },
  async deleteDon(id) {
    await supabase.from('dons').delete().eq('id', id);
  },

  // ANNONCES
  async getAnnonces(publicOnly = false) {
    let q = supabase.from('annonces').select('*').order('date_evenement');
    if (publicOnly) q = q.eq('statut', 'publié');
    const { data } = await q;
    return data ?? [];
  },
  async addAnnonce(a) {
    const { data, error } = await supabase.from('annonces').insert([a]).select().single();
    return { data, error };
  },
  async updateAnnonce(id, changes) {
    await supabase.from('annonces').update(changes).eq('id', id);
  },
  async deleteAnnonce(id) {
    await supabase.from('annonces').delete().eq('id', id);
  },
};
