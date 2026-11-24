# Come Convertire MyFinance Pro in File .APK per Android

Questa guida spiega tutti i metodi per convertire l'applicazione in un file `.APK` nativo per Android.

---

## Metodo 1: 1-Click con PWABuilder (Il più rapido, zero installazioni)

1. Vai sul sito ufficiale Microsoft / Google: [https://www.pwabuilder.com](https://www.pwabuilder.com)
2. Incolla l'URL della tua applicazione e premi **Start**.
3. Se il bot ti chiede la descrizione o il manifest (perché l'ambiente di anteprima è protetto):
   - Apri l'app > tocca il pulsante **APK** > tocca **"Copia Codice manifest.json"**.
   - Incollalo nella schermata di PWABuilder.
4. Clicca su **Package for Stores** e seleziona **Android**.
5. Clicca su **Download APK** (oppure **AAB** per Google Play Store).
6. Riceverai un file zip contenente `app-release-signed.apk` pronto da installare sul telefono!

---

## Metodo 2: Compilazione Rapida con Capacitor & Android Studio

Se hai un PC o Mac con Android Studio installato:

1. Nel terminale del progetto:
   ```bash
   npm run build
   npx @capacitor/cli add android
   npx @capacitor/cli sync android
   ```
2. Apri il progetto in Android Studio:
   ```bash
   npx @capacitor/cli open android
   ```
3. In Android Studio, vai nel menu:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. Troverai il file pronto in:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Metodo 3: Installazione Diretta su Android (WebAPK Nativo, Zero Download)

Se il tuo scopo è avere l'app installata sul tuo smartphone come una vera applicazione Android offline:

1. Apri il link dell'app su **Google Chrome per Android**.
2. Tocca i tre puntini (**⋮**) in alto a destra.
3. Seleziona **"Aggiungi a schermata Home"** (oppure premi il pulsante **"Installa Ora"** dentro l'app).
4. Android installerà l'app nel cassetto delle applicazioni (App Drawer) a schermo intero con icona e supporto 100% offline!
