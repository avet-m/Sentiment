import PorterStemmer from './natural/stemmers/porter_stemmer_ru.js';

class NaiveBayes {

  constructor(){
      /*
       * A collection of added documents
       * Each document is an object containing the class, and array of stemmed words.
       */
      this.docs = [];

      /*
       * Index of last added document.
       */
      this.lastAdded = 0;

      /*
       * A map of all class features.
       */
      this.features = {};

      /*
       * A map containing each class and associated features.
       * Each class has a map containing a feature index and the count of feature appearances for that class.
       */
      this.classFeatures = {};

      /*
       * Keep track of how many features in each class.
       */
      this.classTotals = {};

      /*
       * Number of examples trained
       */
      this.totalExamples = 1;

      /* Additive smoothing to eliminate zeros when summing features,
       * in cases where no features are found in the document.
       * Used as a fail-safe to always return a class.
       * http://en.wikipedia.org/wiki/Additive_smoothing
       */
      this.smoothing = 1;
  }

  /**
   * AddDocument
   * @param {array|string} doc - document
   * @param {string} label - class
   * @return {object} - Bayes classifier instance
   */
  addDocument = (doc, label) => {
    if (!this._size(doc)) {
      return;
    }

    if (this._isString(doc)) {
      // Return array of stemmed words
      doc = PorterStemmer.tokenizeAndStem(doc);
    }

    const docObj = {
      label: label,
      value: doc
    };

    this.docs.push(docObj);

    // Add token (feature) to features map
    for (let i = 0; i < doc.length; i++) {
      this.features[doc[i]] = 1;
    }
  };

  /**
   * AddDocuments
   * @param {array} docs - documents
   * @param {string} label - class
   * @return {object} - Bayes classifier instance
   */
  addDocuments = (docs, label) => {
    for (let i = 0; i < docs.length; i++) {
      this.addDocument(docs[i], label);
    }
  };

  /**
   * docToFeatures
   *
   * @desc
   * Returns an array with 1's or 0 for each feature in document
   * A 1 if feature is in document
   * A 0 if feature is not in document
   *
   * @param {string|array} doc - document
   * @return {array} features
   */
  docToFeatures = (doc) => {
    const features = [];

    if (this._isString(doc)) {
      doc = PorterStemmer.tokenizeAndStem(doc);
    }

    for (let feature in this.features) {
      features.push(Number(!!~doc.indexOf(feature)));
    }

    return features;
  };

  /**
   * classify
   * @desc Returns class with highest probability for document.
   * @param {string} doc - document
   * @return {string} class
   */
  classify = (doc) => {
    let classifications = this.getClassifications(doc);

    if (!this._size(classifications)) {
      throw 'Not trained';
    }

    return classifications[0].label;
  };

  /**
   * train
   * @desc train the classifier on the added documents.
   * @return {object} - Bayes classifier instance
   */
  train = () => {
    const totalDocs = this.docs.length;

    for (let i = this.lastAdded; i < totalDocs; i++) {
      const features = this.docToFeatures(this.docs[i].value);

      this.addExample(features, this.docs[i].label);

      this.lastAdded++;
    }
  };

  /**
   * addExample
   * @desc Increment the counter of each feature for each class.
   * @param {array} docFeatures
   * @param {string} label - class
   * @return {object} - Bayes classifier instance
   */
  addExample = (docFeatures, label) => {
    if (!this.classFeatures[label]) {
      this.classFeatures[label] = {};
      this.classTotals[label] = 1;
    }

    this.totalExamples++;

    if (this._isArray(docFeatures)) {
      var i = docFeatures.length;
      this.classTotals[label]++;

      while(i--) {
        if (docFeatures[i]) {
          if (this.classFeatures[label][i]) {
            this.classFeatures[label][i]++;
          } else {
            this.classFeatures[label][i] = 1 + this.smoothing;
          }
        }
      }
    } else {
      for (let key in docFeatures) {
        const value = docFeatures[key];

        if (this.classFeatures[label][value]) {
          this.classFeatures[label][value]++;
        } else {
          this.classFeatures[label][value] = 1 + this.smoothing;
        }
      }
    }
  };

  /**
   * probabilityOfClass
   * @param {array|string} docFeatures - document features
   * @param {string} label - class
   * @return probability;
   * @desc
   * calculate the probability of class for the document.
   *
   * Algorithm source
   * http://en.wikipedia.org/wiki/Naive_Bayes_classifier
   *
   * P(c|d) = P(c)P(d|c)
   *          ---------
   *             P(d)
   *
   * P = probability
   * c = class
   * d = document
   *
   * P(c|d) = Likelyhood(class given the document)
   * P(d|c) = Likelyhood(document given the classes).
   *     same as P(x1,x2,...,xn|c) - document `d` represented as features `x1,x2,...xn`
   * P(c) = Likelyhood(class)
   * P(d) = Likelyhood(document)
   *
   * rewritten in plain english:
   *
   * posterior = prior x likelyhood
   *             ------------------
   *                evidence
   *
   * The denominator can be dropped because it is a constant. For example,
   * if we have one document and 10 classes and only one class can classify
   * document, the probability of the document is the same.
   *
   * The final equation looks like this:
   * P(c|d) = P(c)P(d|c)
   */
  probabilityOfClass = (docFeatures, label) => {
    let count = 0;
    let prob = 0;

    if (this._isArray(docFeatures)) {
      let i = docFeatures.length;

      // Iterate though each feature in document.
      while(i--) {
        // Proceed if feature collection.
        if (docFeatures[i]) {
          /*
           * The number of occurances of the document feature in class.
           */
          count = this.classFeatures[label][i] || this.smoothing;

          /* This is the `P(d|c)` part of the model.
           * How often the class occurs. We simply count the relative
           * feature frequencies in the corpus (document body).
           *
           * We divide the count by the total number of features for the class,
           * and add it to the probability total.
           * We're using Natural Logarithm here to prevent Arithmetic Underflow
           * http://en.wikipedia.org/wiki/Arithmetic_underflow
           */
          prob += Math.log(count / this.classTotals[label]);
        }
      }
    } else {
      for (let key in docFeatures) {
        count = this.classFeatures[label][docFeatures[key]] || this.smoothing;
        prob += Math.log(count / this.classTotals[label]);
      }
    }

    /*
     * This is the `P(c)` part of the model.
     *
     * Divide the the total number of features in class by total number of all features.
     */
    let featureRatio = (this.classTotals[label] / this.totalExamples);

    /**
     * probability of class given document = P(d|c)P(c)
     */
    prob = featureRatio * Math.exp(prob);

    return prob;
  };


  /**
   * getClassifications
   * @desc Return array of document classes their probability values.
   * @param {string} doc - document
   * @return classification ordered by highest probability.
   */
  getClassifications = (doc) => {
    let labels = [];

    for (let className in this.classFeatures) {
      labels.push({
        label: className,
        value: this.probabilityOfClass(this.docToFeatures(doc), className)
      });
    }

    return labels.sort((x, y) => {
      return y.value - x.value;
    });
  };

  /*
   * Helper utils
   */
  _isString = (s) => {
    return typeof(s) === 'string' || s instanceof String;
  };

  _isArray = (s) => {
    return Array.isArray(s);
  };

  _isObject = (s) => {
    return typeof(s) === 'object' || s instanceof Object;
  };

  _size = (s) => {
    if (this._isArray(s) || this._isString(s) || this._isObject(s)) {
      return s.length;
    }
    return 0;
  };


}

/*
 * Export constructor
 */
export default NaiveBayes;
