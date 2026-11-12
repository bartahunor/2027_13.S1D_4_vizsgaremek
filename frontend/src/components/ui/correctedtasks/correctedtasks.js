// correctedtasks.js
import DefaultSolution from './solutions/DefaultSolution';
import MultipleChoiceSolution from './solutions/MultipleChoiceSolution';
import OrderedSolution from './solutions/OrderedSolution';
import TableSolution from './solutions/TableSolution';
import DefaultExplanation from './explenations/DefaultExplanation';

// Feladattípusonként: melyik komponens mutassa a megoldást (Solution)
// és a magyarázatot (Explanation). `null` = nem jelenik meg semmi.
export const taskTypes = {
    rovid_valasz: {
        Solution: DefaultSolution,
        Explanation: DefaultExplanation
    },
    tobb_opcio: {
        Solution: MultipleChoiceSolution,
        Explanation: DefaultExplanation,
    },
    tobb_valasz: {
        Solution: MultipleChoiceSolution,
        Explanation: DefaultExplanation,
    },
    sorba_rendezos: {
        Solution: OrderedSolution,
        Explanation: DefaultExplanation,
    },
    tablazatos_feladat: {
        Solution: TableSolution,
        Explanation: DefaultExplanation,
    }
};

export const fallbackType = {
    Solution: DefaultSolution,
    Explanation: null,
};