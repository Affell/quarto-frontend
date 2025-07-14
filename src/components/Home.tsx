import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <div className="home">
      <div className="home-content">
        <h1>Bienvenue au Quarto</h1>
        <div className="game-description">
          <p>
            Le Quarto est un jeu de stratégie pour deux joueurs créé par Blaise
            Müller.
          </p>
          <p>
            Le but est d'aligner 4 pièces ayant au moins une caractéristique
            commune :
          </p>
          <ul>
            <li>
              <strong>Couleur :</strong> blanc ou noir
            </li>
            <li>
              <strong>Forme :</strong> carré ou rond
            </li>
            <li>
              <strong>Taille :</strong> grand ou petit
            </li>
            <li>
              <strong>Remplissage :</strong> plein ou troué
            </li>
          </ul>
          <p>
            La particularité du Quarto est que c'est votre adversaire qui
            choisit la pièce que vous devez jouer !
          </p>
        </div>

        <div className="game-actions">
          <Link to="/auth" className="play-button">
            Jouer en ligne
          </Link>
          <Link to="/solo" className="play-button secondary">
            Jouer contre l'ordinateur
          </Link>
        </div>

        <div className="rules">
          <h2>Règles du jeu</h2>
          <ol>
            <li>
              Chaque joueur à son tour sélectionne une pièce pour son adversaire
            </li>
            <li>L'adversaire doit placer cette pièce sur le plateau</li>
            <li>
              Le premier à aligner 4 pièces avec une caractéristique commune
              gagne
            </li>
            <li>Si le plateau est rempli sans vainqueur, c'est un match nul</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Home;
