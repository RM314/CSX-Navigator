import type { ChatMessage, DocumentItem} from './types';

/*
export const SOURCE_CHUNKS: Record<string, SourceChunk> = {
  'Community kitchen case study': {
    label: 'Community kitchen case study · chunk 3',
    text: 'A neighborhood kitchen can change local routines by giving residents a recurring place for cooking, meeting, and sharing food practices. Repeated use of the same place stabilizes new collective habits over time.',
  },
  'Shared space and routine formation': {
    label: 'Shared space and routine formation · chunk 7',
    text: 'When a shared space becomes reliably available, coordination costs fall. People begin to plan regular activities around that space, which supports the formation of repeated local habits.',
  },
  'Shared space example': {
    label: 'Shared space example · chunk 2',
    text: 'A workshop or kitchen does not only provide infrastructure. It also makes repeated collaboration visible and easier, which is why it often shifts behavior from isolated action to shared routine.',
  },
  'Local habit formation': {
    label: 'Local habit formation · chunk 5',
    text: 'Local habits change when a place enables repeated interaction, lowers the threshold for participation, and links people to shared schedules, tools, and practices.',
  },
};
*/

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'system',
    content: 'CSX Assistant is ready. Answers should be grounded in the available document context.',
    meta: 'System message',
  },
  {
    role: 'user',
    content: 'Give an example how space facilitates changes in local habits.',
    meta: 'You',
  },
  {
    role: 'assistant',
    content:
      'A simple example would be a neighborhood space that includes a community kitchen and garden. Before that space existed, people in the area mainly bought food individually and had few shared routines. Once the space became available, new local habits could emerge: people started cooking together, exchanging recipes, planning regular harvest days, and organizing meals around what was locally grown.',
    meta: 'Assistant',
    //sources: ['Community kitchen case study', 'Shared space and routine formation'],
    sources: [
    {
      id: "demo-1",
      docId: "demo-doc-1",
      title: "Community kitchen case study",
      source: "demo",
      content: "demo",
      chunkIndex: 0,
      uuid: "11111111-1111-4111-8111-111111111111",
      score: 1,
    },
    {
      id: "demo-2",
      docId: "demo-doc-2",
      title: "Shared space and routine formation",
      source: "demo",
      content: "demo",
      chunkIndex: 1,
      uuid: "22222222-2222-4222-8222-222222222222",
      score: 1,
    },],
  },
  {
    role: 'assistant',
    content: 'Would you like an example from agriculture, culture, or an urban neighborhood project?',
    meta: 'Assistant follow-up',
  },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  { id: 1, title: 'Community Kitchen Case Study', author: 'Anna Meyer', type: 'PDF' },
  { id: 2, title: 'Shared Space and Routine Formation', author: 'Paul Richter', type: 'PDF' },
  { id: 3, title: 'Urban Workshop Notes', author: 'M. Becker', type: 'TXT' },
];
