// taskTypes.js
import DefaultSource from './leftside/DefaultSource';
import TableSource from './leftside/TableSource';
import DefaultAnswer from './rightside/DefaultAnswer';
import MultipleChoiceAnswer from './rightside/MultipleChoiceAnswer';
import MultipleSelectAnswer from './rightside/MultipleSelectAnswer';
import OrderedAnswer from './rightside/OrderedAnswer';

const serializeTable = (value, task) => {
    const answers = value ?? {};

    return (task.cellak ?? [])
        .filter((c) => c.lathato === false && c.ertek === null)
        .map((c) => {
            const raw = answers[`${c.sor_sorszam}-${c.oszlop_sorszam}`];
            const text = typeof raw === 'string' ? raw.trim() : '';

            return {
                sor_sorszam: c.sor_sorszam,
                oszlop_sorszam: c.oszlop_sorszam,
                valasz: text === '' ? null : text,
            };
        });
};

const serializeOrdered = (value, task) => {
    const items = task.valaszok ?? [];

    const isValid =
        Array.isArray(value) &&
        value.length === items.length &&
        items.every((item) => value.includes(item));

    return isValid ? value.map(String) : null;
};

export const taskTypes = {
    rovid_valasz: {
        Source: DefaultSource,
        Answer: DefaultAnswer,
    },
    tobb_opcio: {
        Source: DefaultSource,
        Answer: MultipleChoiceAnswer,
    },
    tablazatos_feladat: {
        Source: TableSource,
        Answer: null,
        serialize: serializeTable,
    },
    tobb_valasz: {
        Source: DefaultSource,
        Answer: MultipleSelectAnswer,
    },
    sorba_rendezos: {
        Source: DefaultSource,
        Answer: OrderedAnswer,
        serialize: serializeOrdered,
    }
    
};

export const fallbackType = {
    Source: DefaultSource,
    Answer: DefaultAnswer,
};