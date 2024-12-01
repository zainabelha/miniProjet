Description du Projet
Ce projet simule un système d'intelligence artificielle basé sur des comportements de véhicules dans un environnement interactif. Les véhicules peuvent se déplacer, suivre un leader, éviter des obstacles, errer de manière autonome ou attaquer un ennemi. Le comportement des véhicules est influencé par des forces de steering (guidage) et des règles définies pour chaque mode d'interaction.

Fonctionnalités Principales
Suivi du curseur : Le leader principal suit le curseur de la souris.
Formation de groupe : Les véhicules ajoutés forment un "snake" en suivant le véhicule précédent.
Wanderers : Certains véhicules errent de manière autonome dans l'environnement.
Évitement d'obstacles : Les véhicules détectent et évitent automatiquement les obstacles.
Attaque d'un ennemi : Les véhicules peuvent s'arrêter et tirer sur un ennemi généré.
Interaction avec l'environnement : Les utilisateurs peuvent ajouter des véhicules, des obstacles et des ennemis à l'environnement. 

Contrôle du projet:
f	=> Ajoute un groupe de 10 véhicules à la formation "snake". Ils suivent le dernier véhicule ajouté.
w => Ajoute un wanderer. Les wanderers errent de manière autonome et évitent les obstacles.
e => Génère un ennemi à une position aléatoire sur le canvas. Les véhicules attaquent automatiquement l'ennemi.
v	=>Ajoute un véhicule indépendant à une position aléatoire.
d => Active ou désactive le mode debug pour afficher les vecteurs de force et les rayons d'évitement.

Interaction avec la Souris
Clic gauche : Ajoute un obstacle à la position de la souris. Les obstacles sont visibles en vert, et les véhicules les évitent automatiquement.

"Je tiens à mentionner que j'ai utilisé ChatGPT pour m'aider à résoudre certains problèmes et à améliorer les fonctionnalités de ce projet."

Je tiens à remercier M. Michel Buffa pour les informations précieuses et les ressources partagées dans le cadre de son cours, qui ont été d'une grande valeur.
