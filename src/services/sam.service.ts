import axios from "axios"

export const getAll = async () => {
    console.log("calling SAM Users/GetAll")
    const url = `${process.env.SAM_API_URL}/GetAll/`
    const response = await axios
        .get(`${url}`, {
            params: {
                getIDIR: true
            },
            auth: {
                username: `${process.env.SAM_API_USERNAME}`,
                password: `${process.env.SAM_API_PASSWORD}`
            }
        })
        .then(
            (response) => {
                if (response?.data) {
                    console.log("SAM Users/GetAll returned successfully")
                    return response.data
                }
                return null
            }
        )
        .catch((error) => {
            console.log(error)
            return error
        })
    return response
}
