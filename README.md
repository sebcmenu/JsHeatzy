# JsHeatzy
## Application javascript "standalone" pour programmer les Heatzy Pilote
*(See english description below)*

Pour installer l'application, il suffit de récupérer le package et d'ouvrir le fichier **Heatzy.html** dans un navigateur (testé dans Chrome, devrait marcher dans Firefox, pour IE/Edge : j'en sais rien - mais ça se trouve, ça marche ;)-).
NB : l'application est prévue pour fonctionner sur un écran d'ordinateur, (et plutot un assez haut). Elle supporte plus ou moins bien le resizing, mais n'est pas du tout prévu pour les petits écrans (smartphone , tablette... Pour cela, il y a l'application officielle !!)

Entrez votre compte Heatzy dans la popup (NB : les login/mot de passe ne sont pas stockés par l'application - et donc il faudra les re-rentrer à chaque fois- et ne sont transmis qu'à l'API Heatzy, de manière sécurisée (http))

Une fois vos boitiers heatzy chargés, vous pouvez utiliser le bouton *Sélectionnez une zone* pour mettre à jour la programmation d'un boitier, dans le panneau de bas de page.

Modifiez tous les boitiers que vous voulez modifier.
Quand vous êtes content du résultat, utilisez le bouton *Enregistrer* en haut sur la droite de l'écran (à coté du bouton de filtrage du calendrier) pour envoyer vos modifications dans le Cloud Heatzy.


Le code est commenté un minimum, ce qui devrait permettre une compréhension globale du mode de fonctionnement de l'application.

#### Important
Si vous voulez héberger l'application sur un serveur web, il vous faudra paramétrer les CORS pour que les requêtes puissent atteindre https://euapi.gizwits.com/

==================================================================
## Standalone javascript application to programm Heatzy Pilote
Please note that despite i've put some effort into translating the README file, the application is in french and not localized any other language (it should not be a big amount of work, but right now, i don't think it's worth the effort)

Just checkout all the files to some directory, and open the **Heatzy.html** file in your favorite browser (it was tested on Chrome, should work flawlessly on Firefox, may work on IE/Edge - untested-).
Please note that the application is designed to work on computer screen (height matters). It will more or less support resizing, but is unlikely to work well on smartphone/tablet screen (but for those, there is the official application)

Enter your heatzy account credential (NB : the credentials are not stored anywhere in the application -and, as a downside, you'll have to type them everytime you restart the page- and only sent to the Heatzy cloud API on a secured connection).

Once your device are loaded, go to *select your zone* and start modify the planning of the selected device in the lower pane.

Do it for any device planning you want to modify.
When you are happy with the result, just use the *Save* button (red in the top right corner of the screen, left of the filter dropdown). It will send your modifications to the Heatzy Cloud).

The code has a minimum level of comments, which should be enough to grab the global architecture of the application.

#### Important
If you wish to host the application on a web server, you'll have to configure CORS so that the ajax request can reach Si vous voulez héberger l'application sur un serveur web, il vous faudra paramétrer les CORS pour que les requêtes puissent atteindre https://euapi.gizwits.com/.
