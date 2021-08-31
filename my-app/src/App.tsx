import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import { API, graphqlOperation, Storage } from 'aws-amplify';
import { listNotes } from './graphql/queries';
import {createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations'
const initialFormState = {name: '', description: '', image: ''}

function App() {
  const[notes, setNotes] = useState<Object[]>([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData: any = await API.graphql(graphqlOperation(listNotes));
    console.log(apiData);
    const notesFromAPI:any = setNotes(apiData.data.listNotes.items);
    if(notesFromAPI){
    await Promise.all(notesFromAPI.map(async (note:any) => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
  }
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    console.log(formData.name);
    if (!formData.name || !formData.description) return console.log('no');
    const data_in:any = await API.graphql({query: createNoteMutation, variables: {input: formData}});
    console.log(data_in);
    if(formData.image){
      const image:any = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote(id: string) {
    console.log(id);
    const newNotesArray = notes.filter((note:any) => note.id === id);
    setNotes(newNotesArray);
    await API.graphql({query:deleteNoteMutation, variables: {input: {id}}});
  }

  async function onChange(e: any) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    setFormData({...formData, image: file.name});
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App">
      <h1>My Notes App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value })}
        placeholder="Note name"
        value={formData.name}></input>
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value })}
        placeholder="Note description"
        value={formData.description}></input>
        <input type="file" onChange={onChange} />
      <button onClick={createNote}>Create Note</button>
      <div style={{marginBottom: 30}}>
        {
          notes.map((note:any) => (
            <div key={note.id || note.name}>
              <h2>{note.id}</h2>
              <h2>{note.name}</h2>
              <h3>{note.description}</h3>
              <button onClick={() => deleteNote(note.id)}>Delete Note</button> 
              {
                note.image && <img src={note.image} style={{width:400}} />
              }
              </div> 
          ))
        }
      </div>
      <AmplifySignOut/>
    </div>
  );
}

export default withAuthenticator(App);
