# Updating each client with client specific data

- Two listeners server side on for update trigger and one for load event

- Listener client side for the update event which emits load event with client data and callback

- Server modified client data gets sent back through callback
