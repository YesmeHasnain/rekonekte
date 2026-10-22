import { createContext, useContext, useEffect, useState } from 'react'
import { PHRASES } from './phrases.js'

const dict = {
  en: {
    'nav.product': 'Product', 'nav.features': 'Features', 'nav.community': 'Community', 'nav.events': 'Events', 'nav.safety': 'Safety',
    'nav.login': 'Log in', 'nav.join': 'Join free', 'nav.openApp': 'Open app',
    'hero.eyebrow': 'Kominote OS · for the Haitian diaspora',
    'hero.title1': 'Find your person.', 'hero.title2': 'Find your people.',
    'hero.sub': 'Rekonekte is one home for lanmou and kominote — date with intention, chat safely, and plug into Haitian life in your city, from Miami to Montréal.',
    'hero.cta': 'Create your profile', 'hero.cta2': 'Take a look',
    'tab.discover': 'Discover', 'tab.messages': 'Messages', 'tab.community': 'Community',
    'sec.bento': 'Everything lakay, in one place', 'sec.build': 'Build your profile in a minute', 'sec.how': 'From bonjou to lakay',
    'sec.community': 'More than dating — a kominote', 'sec.events': 'Happening near you', 'sec.safety': 'Safety is a feature, not a footnote',
    'sec.stories': 'Rekonekte stories', 'sec.faq': 'Questions, answered', 'sec.cta': 'Your people are waiting.',
    'side.discover': 'Discover', 'side.messages': 'Messages', 'side.community': 'Community', 'side.events': 'Events', 'side.profile': 'Profile', 'side.settings': 'Settings', 'side.admin': 'Admin',
    'app.search': 'Search members, posts, events…', 'app.filters': 'Filters', 'app.age': 'Age', 'app.gender': 'Show me', 'app.city': 'City', 'app.reset': 'Reset',
    'btn.like': 'Like', 'btn.pass': 'Pass', 'btn.message': 'Message', 'btn.send': 'Send', 'btn.block': 'Block', 'btn.report': 'Report', 'btn.save': 'Save changes', 'btn.edit': 'Edit profile', 'btn.post': 'Post', 'btn.newPost': 'New post', 'btn.rsvp': 'RSVP', 'btn.going': 'Going', 'btn.logout': 'Log out',
    'auth.loginTitle': 'Bon retou! Welcome back', 'auth.registerTitle': 'Join the kominote', 'auth.verifyTitle': 'Check your inbox', 'auth.resetTitle': 'Reset your password',
    'h.discover': 'Discover', 'h.messages': 'Messages', 'h.community': 'Community board', 'h.events': 'Events', 'h.profile': 'My profile', 'h.settings': 'Settings', 'h.admin': 'Admin dashboard',
    'footer.tag': 'Love · Community · Home',
  },
  fr: {
    'nav.product': 'Produit', 'nav.features': 'Fonctions', 'nav.community': 'Communauté', 'nav.events': 'Événements', 'nav.safety': 'Sécurité',
    'nav.login': 'Connexion', 'nav.join': 'Inscription', 'nav.openApp': "Ouvrir l'app",
    'hero.eyebrow': 'Kominote OS · pour la diaspora haïtienne',
    'hero.title1': 'Trouvez la bonne personne.', 'hero.title2': 'Retrouvez les vôtres.',
    'hero.sub': "Rekonekte réunit l'amour et la communauté — rencontrez avec intention, discutez en sécurité et vivez la culture haïtienne dans votre ville, de Miami à Montréal.",
    'hero.cta': 'Créer mon profil', 'hero.cta2': "Essayer l'app",
    'tab.discover': 'Découvrir', 'tab.messages': 'Messages', 'tab.community': 'Communauté',
    'sec.bento': 'Tout lakay, au même endroit', 'sec.build': 'Votre profil en une minute', 'sec.how': 'De bonjou à lakay',
    'sec.community': 'Plus que des rencontres — une communauté', 'sec.events': 'Près de chez vous', 'sec.safety': 'La sécurité, une vraie fonction',
    'sec.stories': 'Histoires Rekonekte', 'sec.faq': 'Questions fréquentes', 'sec.cta': 'Les vôtres vous attendent.',
    'side.discover': 'Découvrir', 'side.messages': 'Messages', 'side.community': 'Communauté', 'side.events': 'Événements', 'side.profile': 'Profil', 'side.settings': 'Réglages', 'side.admin': 'Admin',
    'app.search': 'Rechercher membres, posts, événements…', 'app.filters': 'Filtres', 'app.age': 'Âge', 'app.gender': 'Afficher', 'app.city': 'Ville', 'app.reset': 'Réinitialiser',
    'btn.like': "J'aime", 'btn.pass': 'Passer', 'btn.message': 'Écrire', 'btn.send': 'Envoyer', 'btn.block': 'Bloquer', 'btn.report': 'Signaler', 'btn.save': 'Enregistrer', 'btn.edit': 'Modifier le profil', 'btn.post': 'Publier', 'btn.newPost': 'Nouveau post', 'btn.rsvp': 'Participer', 'btn.going': 'Inscrit', 'btn.logout': 'Déconnexion',
    'auth.loginTitle': 'Bon retour !', 'auth.registerTitle': 'Rejoignez la kominote', 'auth.verifyTitle': 'Vérifiez votre boîte mail', 'auth.resetTitle': 'Réinitialiser le mot de passe',
    'h.discover': 'Découvrir', 'h.messages': 'Messages', 'h.community': 'Tableau communautaire', 'h.events': 'Événements', 'h.profile': 'Mon profil', 'h.settings': 'Réglages', 'h.admin': 'Tableau admin',
    'footer.tag': 'Amour · Communauté · Chez soi',
  },
  ht: {
    'nav.product': 'Pwodui', 'nav.features': 'Fonksyon', 'nav.community': 'Kominote', 'nav.events': 'Evènman', 'nav.safety': 'Sekirite',
    'nav.login': 'Konekte', 'nav.join': 'Enskri gratis', 'nav.openApp': 'Louvri app la',
    'hero.eyebrow': 'Kominote OS · pou dyaspora ayisyen an',
    'hero.title1': 'Jwenn moun ou.', 'hero.title2': 'Jwenn pèp ou.',
    'hero.sub': 'Rekonekte se yon sèl app pou lanmou ak kominote — renmen ak entansyon, pale an sekirite, epi viv lakay nan vil ou, soti Miami rive Monreyal.',
    'hero.cta': 'Kreye pwofil ou', 'hero.cta2': 'Eseye app la',
    'tab.discover': 'Dekouvri', 'tab.messages': 'Mesaj', 'tab.community': 'Kominote',
    'sec.bento': 'Tout bagay lakay, yon sèl kote', 'sec.build': 'Fè pwofil ou nan yon minit', 'sec.how': 'Soti bonjou rive lakay',
    'sec.community': 'Plis pase renmen — yon kominote', 'sec.events': 'Sa k ap pase toupre w', 'sec.safety': 'Sekirite se yon fonksyon',
    'sec.stories': 'Istwa Rekonekte', 'sec.faq': 'Kesyon ak repons', 'sec.cta': 'Moun ou yo ap tann ou.',
    'side.discover': 'Dekouvri', 'side.messages': 'Mesaj', 'side.community': 'Kominote', 'side.events': 'Evènman', 'side.profile': 'Pwofil', 'side.settings': 'Paramèt', 'side.admin': 'Admin',
    'app.search': 'Chèche manm, pòs, evènman…', 'app.filters': 'Filt', 'app.age': 'Laj', 'app.gender': 'Montre m', 'app.city': 'Vil', 'app.reset': 'Rekòmanse',
    'btn.like': 'Renmen', 'btn.pass': 'Pase', 'btn.message': 'Ekri', 'btn.send': 'Voye', 'btn.block': 'Bloke', 'btn.report': 'Siyale', 'btn.save': 'Anrejistre', 'btn.edit': 'Modifye pwofil', 'btn.post': 'Pibliye', 'btn.newPost': 'Nouvo pòs', 'btn.rsvp': 'Mwen prale', 'btn.going': 'Mwen enskri', 'btn.logout': 'Dekonekte',
    'auth.loginTitle': 'Bon retou! Sak pase?', 'auth.registerTitle': 'Antre nan kominote a', 'auth.verifyTitle': 'Gade imèl ou', 'auth.resetTitle': 'Chanje modpas ou',
    'h.discover': 'Dekouvri', 'h.messages': 'Mesaj', 'h.community': 'Tablo kominote', 'h.events': 'Evènman', 'h.profile': 'Pwofil mwen', 'h.settings': 'Paramèt', 'h.admin': 'Tablo admin',
    'footer.tag': 'Lanmou · Kominote · Lakay',
  },
}

const I18n = createContext({ lang: 'en', setLang: () => {}, t: (k) => k })

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('rk-lang') || 'en' } catch { return 'en' } })
  useEffect(() => { try { localStorage.setItem('rk-lang', lang) } catch {} ; document.documentElement.lang = lang === 'ht' ? 'ht' : lang }, [lang])
  const t = (k) => dict[lang]?.[k] ?? dict.en[k] ?? k
  return <I18n.Provider value={{ lang, setLang, t }}>{children}</I18n.Provider>
}
export const useI18n = () => useContext(I18n)
export const LANGS = [{ id: 'en', label: 'EN', name: 'English' }, { id: 'fr', label: 'FR', name: 'Français' }, { id: 'ht', label: 'HT', name: 'Kreyòl' }]

/** Public-site copy: tr('English text') -> the current language's version (falls back to English). */
export function useTr() {
  const { lang } = useContext(I18n)
  return (en) => (lang === 'en' ? en : PHRASES[en]?.[lang] ?? en)
}
