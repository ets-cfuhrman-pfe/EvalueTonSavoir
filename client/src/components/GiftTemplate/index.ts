import Template, { ErrorTemplate } from './templates';
import './styles.css';
import { parse } from 'gift-pegjs';

const multiple = parse(`
Who's buried in Grant's tomb? {~%-50%Grant=%50%Jefferson=%50%no one####Not sure? There are many answers for this question so do not fret. Not sure? There are many answers for this question so do not fret.}

Grant is _____ in Grant's tomb. {=buried#No one is buried there.=entombed~living}

Grant is buried in Grant's tomb. {FALSE}

Who's buried in Grant's tomb? {=no one=nobody}

When was Ulysses S. Grant born? {#1822:5}

What is the capital of Canada? {=Canada -> Ottawa =Italy -> Rome =Japan -> Tokyo}
`);


const items = multiple.map((item) => Template(item, { theme: 'dark' })).join('');
const errorItemDark = ErrorTemplate('Hello', 'Error');

const lightItems = multiple.map((item) => Template(item, { theme: 'light' })).join('');

const errorItem = ErrorTemplate('Hello', 'Error');

const app = document.getElementById('app');
if (app) app.innerHTML = items + errorItemDark + lightItems + errorItem;
