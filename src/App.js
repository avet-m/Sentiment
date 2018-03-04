import React, { Component } from 'react';
import logo from './pos_neg.png';
import './App.css';

import NaiveBayes from './NaiveBayes.js';
const classifier = new NaiveBayes();

class App extends Component {
    state = {
        result: null,
        sentence: '',
        positive: '',
        negative: '',
    }

    _onChange = (e) => {
        this.setState({ result: null, [e.target.name]: e.target.value })
    }

    _onCheck = (sentence) => {
        const result = classifier.classify(sentence);
        this.setState({
            result: result === 'positive' ? 'Предложение позитивное' :  'Предложение негативное'
        });
    }

    _onAdd = (type, sentence) => {
        this.setState({ [type]: '' })
        classifier.addDocuments(sentence, type);
        classifier.train();
    }

    componentWillMount() {
        const positiveDocuments = [
            'Я люблю играть.',
            'Тебе и мне интересно вместе гулять',
            'Собака лучший друг человека',
            'Мне нравиться наука',
        ];

        const negativeDocuments = [
            'Ты плохой друг',
            'мне ужасно больно',
            'На меня кричала учительница',
            'Мой брат ругал меня сильно',
        ];

        classifier.addDocuments(positiveDocuments, 'positive');
        classifier.addDocuments(negativeDocuments, 'negative');

        classifier.train();
    }

    render() {
        const { sentence, positive, negative, result } = this.state;

        return (
          <div className="App">
            <header className="App-header">
              <img src={logo} className="App-header-img" alt="img" />
            </header>
            <h1>Выборка</h1>
            <div>
              <h3>Позитивные предложения</h3>
              <ul>
                <li>Я люблю играть</li>
                <li>Тебе и мне интересно вместе гулять</li>
                <li>Собака лучший друг человека</li>
                <li>Мне нравиться наука</li>
              </ul>
            </div>
            <div>
              <h3>Негативные предложения</h3>
              <ul>
                <li>Ты плохой друг</li>
                <li>мне ужасно больно</li>
                <li>На меня кричала учительница</li>
                <li>Мой брат ругал меня сильно</li>
              </ul>
            </div>
            <div>
                <textarea value={positive} placeholder="Введите позитивное предложение" name="positive" onChange={this._onChange}/>
                <button onClick={() => this._onAdd('positive', positive)}>Добавить</button>
            </div>
            <div>
                <textarea value={negative} placeholder="Введите негативное предложение" name="negative" onChange={this._onChange}/>
                <button onClick={() => this._onAdd('negative', negative)}>Добавить</button>
            </div>
            <div>
                <input type="text" name="sentence" value={sentence} placeholder="Введите предложение" onChange={this._onChange}/>
                <button onClick={() => this._onCheck(sentence)}>Проверить</button>
                {result && <p>{result}</p>}
            </div>
          </div>
        );
    }
}

export default App;
