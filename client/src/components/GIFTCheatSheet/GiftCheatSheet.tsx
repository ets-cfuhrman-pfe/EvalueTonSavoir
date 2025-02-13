// GiftCheatSheet.tsx
import React, { useState } from 'react';
import './giftCheatSheet.css';

const GiftCheatSheet: React.FC = () => {
    const [copySuccess, setCopySuccess] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopySuccess(true); // Afficher le message de succès
                console.log(copySuccess);
                // Masquer le message de succès après quelques secondes
                setTimeout(() => {
                    setCopySuccess(false);
                }, 3000); // 3 secondes
            })
            .catch((error) => {
                console.error('Erreur lors de la copie dans le presse-papiers : ', error);
            });
    };
    

    const QuestionVraiFaux = "::Exemple de question vrai/faux:: \n 2+2 \\= 4 ? {T}  //Utilisez les valeurs {T}, {F}, {TRUE} et {FALSE}.";
    const QuestionChoixMul = "::Ville capitale du Canada:: \nQuelle ville est la capitale du Canada? {\n~ Toronto\n~ Montréal\n= Ottawa #Rétroaction spécifique.\n}  // Commentaire non visible (au besoin)";
    const QuestionChoixMulMany = "::Villes canadiennes:: \n Quelles villes trouve-t-on au Canada? { \n~ %33.3% Montréal \n ~ %33.3% Ottawa \n ~ %33.3% Vancouver \n ~ %-100% New York \n ~ %-100% Paris \n#### Rétroaction globale de la question. \n}  // Utilisez tilde (signe de vague) pour toutes les réponses. // On doit indiquer le pourcentage de chaque réponse.";
    const QuestionCourte ="::Clé et porte:: \n Avec quoi ouvre-t-on une porte? { \n= clé \n= clef \n} // Permet de fournir plusieurs bonnes réponses. // Note: La casse n'est pas prise en compte.";
    const QuestionNum ="::Question numérique avec marge:: \nQuel est un nombre de 1 à 5 ? {\n#3:2\n}\n \n// Plage mathématique spécifiée avec des points de fin d'intervalle. \n ::Question numérique avec plage:: \n Quel est un nombre de 1 à 5 ? {\n#1..5\n} \n\n// Réponses numériques multiples avec crédit partiel et commentaires.\n::Question numérique avec plusieurs réponses::\nQuand est né Ulysses S. Grant ? {\n# =1822:0 # Correct ! Crédit complet. \n=%50%1822:2 # Il est né en 1822. Demi-crédit pour être proche.\n}";
    return (
        <div className="gift-cheat-sheet">
            <h2 className="subtitle">Informations pratiques sur l&apos;éditeur</h2>
            <span>
                L&apos;éditeur utilise le format GIFT (General Import Format Template) créé pour la
                plateforme Moodle afin de générer les mini-tests. Ci-dessous vous pouvez retrouver la
                syntaxe pour chaque type de question&nbsp;:
            </span>
            <div className="question-type">
                <h4>1. Questions Vrai/Faux</h4>
                <pre>
                    <code className="selectable-text">
                        {QuestionVraiFaux}
                    </code>

                </pre>
                <button onClick={() => copyToClipboard(QuestionVraiFaux)}>Copier</button>
            </div>

            <div className="question-type">
                <h4>2. Questions à choix multiple</h4>
                <pre>
                    <code className="question-code-block selectable-text">
                        {
                            QuestionChoixMul
                        }
                    </code>
                </pre>
                <button onClick={() => copyToClipboard(QuestionChoixMul)}>Copier</button>
            </div>
            <div className="question-type">
                <h4>3. Questions à choix multiple avec plusieurs réponses</h4>
                <pre>
                    <code className="question-code-block selectable-text">
                        {
                            QuestionChoixMulMany
                        }
                    </code>
                </pre>
                <button onClick={() => copyToClipboard(QuestionChoixMulMany)}>Copier</button>
            </div>

            <div className="question-type">
                <h4>4. Questions à réponse courte</h4>
                <pre>
                    <code className="question-code-block selectable-text">
                        {QuestionCourte}
                    </code>
                </pre>
                <button onClick={() => copyToClipboard(QuestionCourte)}>Copier</button>
            </div>

            <div className="question-type">
                <h4> 5. Questions numériques </h4>
                <pre>
                    <code className="question-code-block selectable-text">
                        {
                            QuestionNum
                        }
                    </code>                    
                </pre>
                <button onClick={() => copyToClipboard(QuestionNum)}>Copier</button>
            </div>

            <div className="question-type">
                <h4> 6. Paramètres optionnels </h4>
                <pre>
                    <code className="question-code-block selectable-text">
                        {'::Titre:: '}
                        <span className="code-comment selectable-text">
                            {' // Ajoute un titre à une question'}
                        </span>
                        <br />
                        {'# Feedback '}
                        <span className="code-comment selectable-text">
                            {' // Feedback pour UNE réponse'}
                        </span>
                        <br />
                        {'// Commentaire '}
                        <span className="code-comment selectable-text">
                            {' // Commentaire non apparent'}
                        </span>
                        <br />
                        {'#### Feedback général '}
                        <span className="code-comment selectable-text">
                            {' // Feedback général pour une question'}
                        </span>
                        <br />
                        {'%50% '}
                        <span className="code-comment selectable-text">
                            {" // Poids d'une réponse (peut être négatif)"}
                        </span>
                    </code>
                </pre>
            </div>

            <div className="question-type">
                <h4> 7. Caractères spéciaux </h4>
                <p>
                    Si vous souhaitez utiliser certains caractères spéciaux dans vos énoncés,
                    réponses ou feedback, vous devez «échapper» ces derniers en ajoutant un \
                    devant:
                </p>
                <pre>
                    <code className="question-code-block selectable-text">
                        {'\\~ \n\\= \n\\# \n\\{ \n\\} \n\\:'}
                    </code>
                </pre>
            </div>

            <div className="question-type">
                <h4> 8. LaTeX et Markdown</h4>
                <p>
                    Les formats LaTeX et Markdown sont supportés dans cette application. Vous devez cependant penser
                    à «échapper» les caractères spéciaux mentionnés plus haut.
                </p>
                <p>Exemple d&apos;équation:</p>
                <pre>
                    <code className="question-code-block selectable-text">{'$$x\\= \\frac\\{y^2\\}\\{4\\}$$'}</code>
                    <code className="question-code-block selectable-text">{'\n$x\\= \\frac\\{y^2\\}\\{4\\}$'}</code>
                </pre>
                <p>Exemple de texte Markdown:</p>
                <pre>
                    <code className="question-code-block selectable-text">{'[markdown]Grâce à la balise markdown, Il est possible d\'insérer du texte *italique*, **gras**, du `code` et bien plus.'}</code>
                </pre>
            </div>

            <div className="question-type" id="images-section">
                <h4> 9. Images </h4>
                <p>Il est possible d&apos;insérer une image dans une question, une réponse (choix multiple) et dans une rétroaction. D&apos;abord, <strong>le format de l&apos;élément doit être [markdown]</strong>. Ensuite utilisez la syntaxe suivante&nbsp;:</p>
                <pre>
                    <code className="question-code-block">
                        {'!['}
                        <span className="code-comment">{`text alternatif`}</span>
                        {']('}
                        <span className="code-comment">{`URL-de-l'image`}</span>
                        {' "'}
                        <span className="code-comment">{`texte de l'infobulle`}</span>
                        {'")'}
                    </code>
                </pre>
                <p>Exemple d&apos;une question Vrai/Faux avec l&apos;image d&apos;un chat:</p>
                <pre>
                    <code className="question-code-block">
                        {'[markdown]Ceci est un chat: \n![Image de chat](https\\://www.example.com\\:8000/chat.jpg "Chat mignon")\n{T}'}
                    </code>
                </pre>
                <p>Exemple d&apos;une question à choix multiple avec l&apos;image d&apos;un chat dans une rétroaction&nbsp;:</p>
                <pre>
                    <code className="question-code-block">
                        {`[markdown]Qui a initié le développement d'ÉvalueTonSavoir {=ÉTS#OUI! ![](https\\://www.etsmtl.ca/assets/img/ets.svg "\\=50px")
                        ~EPFL#Non...}`}
                    </code>
                </pre>
                <p>Note&nbsp;: les images étant spécifiées avec la syntaxe Markdown dans GIFT, on doit échapper les caractères spéciales (:) dans l&apos;URL de l&apos;image.</p>
                <p style={{ color: 'red' }}>
                    Attention: l&apos;ancienne fonctionnalité avec les balises <code>{'<img>'}</code> n&apos;est plus
                    supportée.
                </p>
                </div>
            <div className="question-type">
                <h4> 10. Informations supplémentaires </h4>
                <p>
                    GIFT supporte d&apos;autres formats de questions que nous ne gérons pas sur cette
                    application.
                </p>
                <p>Vous pouvez retrouver la Documentation de GIFT (en anglais):</p>
                <a href="https://ethan-ou.github.io/vscode-gift-docs/docs/questions">
                    Documentation de GIFT
                </a>
            </div>
        </div>
    );
};  

export default GiftCheatSheet;
